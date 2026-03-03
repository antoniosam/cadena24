import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  IUser,
  IUserSummary,
  RoleCode,
  PaginatedApiResponse,
  ApiResponse,
} from '@cadena24-wms/shared';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserQueryDto } from './dto';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockUser: IUser = {
  id: 1,
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  birthday: null,
  role: RoleCode.USER,
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockUserSummary: IUserSummary = {
  id: 1,
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: RoleCode.USER,
  active: true,
};

const paginatedResponse: PaginatedApiResponse<IUserSummary> = {
  success: true,
  message: 'Usuarios obtenidos correctamente',
  data: [mockUserSummary],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  },
  timestamp: '2024-01-01T00:00:00.000Z',
};

const singleResponse: ApiResponse<IUser> = {
  success: true,
  message: 'Usuario obtenido correctamente',
  data: mockUser,
  timestamp: '2024-01-01T00:00:00.000Z',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockService: Partial<jest.Mocked<UsersService>> = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      toggleStatus: jest.fn(),
      changePassword: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── GET /users ─────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should call service.findAll and return paginated response', async () => {
      service.findAll.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result.data).toHaveLength(1);
      expect(result.pagination).toBeDefined();
    });

    it('should pass query params to service.findAll', async () => {
      service.findAll.mockResolvedValue(paginatedResponse);

      const query: UserQueryDto = { page: 2, limit: 5, role: RoleCode.ADMIN };
      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  // ── GET /users/:id ─────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('should call service.findOne and return the user', async () => {
      service.findOne.mockResolvedValue(singleResponse);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result.data!.id).toBe(1);
    });

    it('should propagate NotFoundException from service', async () => {
      service.findOne.mockRejectedValue(new NotFoundException('Usuario no encontrado'));

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── POST /users ────────────────────────────────────────────────────────────

  describe('create()', () => {
    const dto: CreateUserDto = {
      email: 'new@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'SecurePass1',
    };

    it('should call service.create and return created user response', async () => {
      const created = { ...singleResponse, data: { ...mockUser, email: 'new@example.com' } };
      service.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result.success).toBe(true);
    });

    it('should propagate ConflictException from service', async () => {
      service.create.mockRejectedValue(
        new ConflictException('El correo electrónico ya está en uso')
      );

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ── PATCH /users/:id ───────────────────────────────────────────────────────

  describe('update()', () => {
    const dto: UpdateUserDto = { firstName: 'Updated' };

    it('should call service.update and return updated user', async () => {
      const updated = { ...singleResponse, data: { ...mockUser, firstName: 'Updated' } };
      service.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result.data!.firstName).toBe('Updated');
    });

    it('should propagate NotFoundException from service', async () => {
      service.update.mockRejectedValue(new NotFoundException('Usuario no encontrado'));

      await expect(controller.update(999, dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ── PATCH /users/:id/toggle-status ────────────────────────────────────────

  describe('toggleStatus()', () => {
    it('should call service.toggleStatus with the correct id', async () => {
      const toggled = { ...singleResponse, data: { ...mockUser, active: false } };
      service.toggleStatus.mockResolvedValue(toggled);

      const result = await controller.toggleStatus(1);

      expect(service.toggleStatus).toHaveBeenCalledWith(1);
      expect(result.data!.active).toBe(false);
    });

    it('should propagate NotFoundException from service', async () => {
      service.toggleStatus.mockRejectedValue(new NotFoundException('Usuario no encontrado'));

      await expect(controller.toggleStatus(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── PATCH /users/:id/password ─────────────────────────────────────────────

  describe('changePassword()', () => {
    const dto: ChangePasswordDto = {
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
      confirmPassword: 'NewPass1',
    };

    it('should call service.changePassword with correct args', async () => {
      service.changePassword.mockResolvedValue({
        success: true,
        message: 'Contraseña actualizada correctamente',
        data: null,
        timestamp: '2024-01-01T00:00:00.000Z',
      });

      const result = await controller.changePassword(1, dto);

      expect(service.changePassword).toHaveBeenCalledWith(1, dto);
      expect(result.success).toBe(true);
    });

    it('should propagate errors from service', async () => {
      service.changePassword.mockRejectedValue(new NotFoundException('Usuario no encontrado'));

      await expect(controller.changePassword(999, dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ── DELETE /users/:id ─────────────────────────────────────────────────────

  describe('remove()', () => {
    it('should call service.remove with the correct id', async () => {
      service.remove.mockResolvedValue({
        success: true,
        message: 'Usuario eliminado correctamente',
        data: null,
        timestamp: '2024-01-01T00:00:00.000Z',
      });

      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
    });

    it('should propagate NotFoundException from service', async () => {
      service.remove.mockRejectedValue(new NotFoundException('Usuario no encontrado'));

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
