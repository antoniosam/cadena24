import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { PasswordService } from './password.service';
import { IUser, IUserSummary, RoleCode } from '@cadena24-wms/shared';
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

// ── Mock factories ────────────────────────────────────────────────────────────

function mockRepository() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findRawById: jest.fn(),
    findRawByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    toggleStatus: jest.fn(),
    delete: jest.fn(),
    existsById: jest.fn(),
  };
}

function mockPasswordService() {
  return {
    hash: jest.fn(),
    compare: jest.fn(),
    validate: jest.fn(),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;
  let repo: ReturnType<typeof mockRepository>;
  let pwdSvc: ReturnType<typeof mockPasswordService>;

  beforeEach(async () => {
    repo = mockRepository();
    pwdSvc = mockPasswordService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repo },
        { provide: PasswordService, useValue: pwdSvc },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findAll() ──────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should return a paginated response with correct structure', async () => {
      repo.findAll.mockResolvedValue({ data: [mockUserSummary], total: 1 });

      const result = await service.findAll({});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.pagination).toBeDefined();
      expect(result.pagination!.total).toBe(1);
    });

    it('should pass query params to the repository', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      const query: UserQueryDto = { role: RoleCode.ADMIN, search: 'john', page: 2, limit: 5 };
      await service.findAll(query);

      expect(repo.findAll).toHaveBeenCalledWith(query);
    });

    it('should return empty data array when no users exist', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
      expect(result.pagination!.total).toBe(0);
    });
  });

  // ── findOne() ─────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('should return ApiResponse<IUser> when user exists', async () => {
      repo.findById.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result.success).toBe(true);
      expect(result.data!.id).toBe(1);
      expect(result.data!.firstName).toBe('John');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw with Spanish message "Usuario no encontrado"', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow('Usuario no encontrado');
    });
  });

  // ── create() ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    const createDto: CreateUserDto = {
      email: 'new@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'PlainPass1',
    };

    it('should create user and hash password', async () => {
      repo.findByEmail.mockResolvedValue(null);
      pwdSvc.hash.mockResolvedValue('$2b$10$hashed');
      repo.create.mockResolvedValue({ ...mockUser, email: 'new@example.com' });

      const result = await service.create(createDto);

      expect(pwdSvc.hash).toHaveBeenCalledWith('PlainPass1');
      expect(result.success).toBe(true);
    });

    it('should throw ConflictException when email already exists', async () => {
      repo.findByEmail.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw with Spanish message when email is taken', async () => {
      repo.findByEmail.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(
        'El correo electrónico ya está en uso'
      );
    });

    it('should NOT pass the plain-text password to the repository', async () => {
      repo.findByEmail.mockResolvedValue(null);
      pwdSvc.hash.mockResolvedValue('$2b$10$hashed');
      repo.create.mockResolvedValue(mockUser);

      await service.create(createDto);

      const callArg = repo.create.mock.calls[0][0];
      expect(callArg.password).not.toBe('PlainPass1');
      expect(callArg.password).toBe('$2b$10$hashed');
    });
  });

  // ── update() ──────────────────────────────────────────────────────────────

  describe('update()', () => {
    const updateDto: UpdateUserDto = { firstName: 'UpdatedName' };

    it('should update and return the updated user', async () => {
      repo.existsById.mockResolvedValue(true);
      repo.findByEmail.mockResolvedValue(null);
      repo.update.mockResolvedValue({ ...mockUser, firstName: 'UpdatedName' });

      const result = await service.update(1, updateDto);

      expect(result.data!.firstName).toBe('UpdatedName');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repo.existsById.mockResolvedValue(false);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when new email belongs to another user', async () => {
      const otherUser: IUser = { ...mockUser, id: 99, email: 'taken@example.com' };
      repo.existsById.mockResolvedValue(true);
      repo.findByEmail.mockResolvedValue(otherUser);

      await expect(service.update(1, { email: 'taken@example.com' })).rejects.toThrow(
        ConflictException
      );
    });
  });

  // ── toggleStatus() ────────────────────────────────────────────────────────

  describe('toggleStatus()', () => {
    it('should return user with active toggled to false', async () => {
      repo.existsById.mockResolvedValue(true);
      repo.toggleStatus.mockResolvedValue({ ...mockUser, active: false });

      const result = await service.toggleStatus(1);

      expect(result.data!.active).toBe(false);
    });

    it('should return user with active toggled to true', async () => {
      repo.existsById.mockResolvedValue(true);
      repo.toggleStatus.mockResolvedValue({ ...mockUser, active: true });

      const result = await service.toggleStatus(1);

      expect(result.data!.active).toBe(true);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repo.existsById.mockResolvedValue(false);

      await expect(service.toggleStatus(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── changePassword() ──────────────────────────────────────────────────────

  describe('changePassword()', () => {
    const dto: ChangePasswordDto = {
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
      confirmPassword: 'NewPass1',
    };

    it('should change password successfully and return success response', async () => {
      pwdSvc.validate.mockReturnValue(undefined);
      repo.findRawById.mockResolvedValue({ id: 1, password: '$2b$10$oldhash' });
      pwdSvc.compare.mockResolvedValue(true);
      pwdSvc.hash.mockResolvedValue('$2b$10$newhash');
      repo.updatePassword.mockResolvedValue(undefined);

      const result = await service.changePassword(1, dto);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      pwdSvc.validate.mockReturnValue(undefined);
      repo.findRawById.mockResolvedValue({ id: 1, password: '$2b$10$oldhash' });
      pwdSvc.compare.mockResolvedValue(false);

      await expect(service.changePassword(1, dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw with Spanish message when current password is wrong', async () => {
      pwdSvc.validate.mockReturnValue(undefined);
      repo.findRawById.mockResolvedValue({ id: 1, password: '$2b$10$oldhash' });
      pwdSvc.compare.mockResolvedValue(false);

      await expect(service.changePassword(1, dto)).rejects.toThrow(
        'La contraseña actual es incorrecta'
      );
    });

    it('should throw BadRequestException when passwords do not match (via validate)', async () => {
      pwdSvc.validate.mockImplementation(() => {
        throw new BadRequestException('Las contraseñas no coinciden');
      });

      await expect(
        service.changePassword(1, { ...dto, confirmPassword: 'Different1' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── remove() ──────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('should delete user successfully and return success response', async () => {
      repo.existsById.mockResolvedValue(true);
      repo.delete.mockResolvedValue(undefined);

      const result = await service.remove(1);

      expect(repo.delete).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repo.existsById.mockResolvedValue(false);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw with Spanish message when user does not exist', async () => {
      repo.existsById.mockResolvedValue(false);

      await expect(service.remove(999)).rejects.toThrow('Usuario no encontrado');
    });
  });
});
