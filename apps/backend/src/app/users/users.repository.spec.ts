import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../prisma/prisma.service';
import { RoleCode } from '@cadena24-wms/shared';
import { UserQueryDto } from './dto';

// ── Prisma mock factory ────────────────────────────────────────────────────

function makePrismaUser(overrides: Partial<ReturnType<typeof basePrismaUser>> = {}) {
  return { ...basePrismaUser(), ...overrides };
}

function basePrismaUser() {
  return {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: '$2b$10$hashedpassword',
    birthday: null,
    role: 'USER' as const,
    active: true,
    refreshToken: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
}

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrismaUser = jest.fn();

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersRepository, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    prisma = module.get(PrismaService);
    mockPrismaUser.mockReset();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // ── findAll() ─────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should call prisma.user.findMany and count with correct args', async () => {
      const user = makePrismaUser();
      (prisma.user.findMany as jest.Mock).mockResolvedValue([user]);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const query: UserQueryDto = {};
      const result = await repository.findAll(query);

      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.user.count).toHaveBeenCalledTimes(1);
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('should apply pagination with correct skip/take', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      const query: UserQueryDto = { page: 3, limit: 5 };
      await repository.findAll(query);

      const call = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
      expect(call.skip).toBe(10); // (page 3 - 1) * limit 5 = 10
      expect(call.take).toBe(5);
    });

    it('should apply role filter when provided', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      const query: UserQueryDto = { role: RoleCode.ADMIN };
      await repository.findAll(query);

      const call = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.role).toBe(RoleCode.ADMIN);
    });

    it('should apply search filter across firstName, lastName, email when provided', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      const query: UserQueryDto = { search: 'john' };
      await repository.findAll(query);

      const call = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where['OR']).toBeDefined();
      expect(call.where['OR']).toHaveLength(3);
    });

    it('should return IUserSummary objects (no password field)', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([makePrismaUser()]);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const { data } = await repository.findAll({});
      expect('password' in data[0]).toBe(false);
      expect(data[0].firstName).toBe('John');
    });
  });

  // ── findById() ────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('should return an IUser when user exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(makePrismaUser());

      const result = await repository.findById(1);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.firstName).toBe('John');
    });

    it('should return null when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById(999);
      expect(result).toBeNull();
    });

    it('should not include password in returned IUser', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(makePrismaUser());

      const result = await repository.findById(1);
      expect('password' in (result as object)).toBe(false);
    });
  });

  // ── findByEmail() ─────────────────────────────────────────────────────────

  describe('findByEmail()', () => {
    it('should return an IUser when user exists with that email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(makePrismaUser());

      const result = await repository.findByEmail('test@example.com');
      expect(result).not.toBeNull();
      expect(result!.email).toBe('test@example.com');
    });

    it('should return null when no user has that email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByEmail('nobody@example.com');
      expect(result).toBeNull();
    });
  });

  // ── create() ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should call prisma.user.create with the correct fields', async () => {
      const created = makePrismaUser({ id: 5, email: 'new@example.com' });
      (prisma.user.create as jest.Mock).mockResolvedValue(created);

      await repository.create({
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: '$2b$10$hashed',
        birthday: null,
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
          }),
        })
      );
    });

    it('should return an IUser without password', async () => {
      (prisma.user.create as jest.Mock).mockResolvedValue(makePrismaUser());

      const result = await repository.create({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: '$2b$10$hashed',
      });

      expect('password' in (result as object)).toBe(false);
      expect(result.id).toBe(1);
    });
  });

  // ── update() ──────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should call prisma.user.update with correct id and data', async () => {
      const updated = makePrismaUser({ firstName: 'Updated' });
      (prisma.user.update as jest.Mock).mockResolvedValue(updated);

      await repository.update(1, { firstName: 'Updated' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ firstName: 'Updated' }),
        })
      );
    });
  });

  // ── updatePassword() ──────────────────────────────────────────────────────

  describe('updatePassword()', () => {
    it('should call prisma.user.update with only the password field', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue(makePrismaUser());

      await repository.updatePassword(1, '$2b$10$newhashedpassword');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: '$2b$10$newhashedpassword' },
      });
    });
  });

  // ── toggleStatus() ────────────────────────────────────────────────────────

  describe('toggleStatus()', () => {
    it('should invert the active field (true → false)', async () => {
      const current = makePrismaUser({ active: true });
      const toggled = makePrismaUser({ active: false });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(current);
      (prisma.user.update as jest.Mock).mockResolvedValue(toggled);

      const result = await repository.toggleStatus(1);
      expect(result.active).toBe(false);
    });

    it('should invert the active field (false → true)', async () => {
      const current = makePrismaUser({ active: false });
      const toggled = makePrismaUser({ active: true });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(current);
      (prisma.user.update as jest.Mock).mockResolvedValue(toggled);

      const result = await repository.toggleStatus(1);
      expect(result.active).toBe(true);
    });

    it('should pass active: !current.active to prisma.update', async () => {
      const current = makePrismaUser({ active: true });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(current);
      (prisma.user.update as jest.Mock).mockResolvedValue(makePrismaUser({ active: false }));

      await repository.toggleStatus(1);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { active: false } })
      );
    });
  });

  // ── delete() ──────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('should call prisma.user.delete with the correct id', async () => {
      (prisma.user.delete as jest.Mock).mockResolvedValue(makePrismaUser());

      await repository.delete(1);

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  // ── existsById() ──────────────────────────────────────────────────────────

  describe('existsById()', () => {
    it('should return true when count > 0', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      const result = await repository.existsById(1);
      expect(result).toBe(true);
    });

    it('should return false when count === 0', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(0);
      const result = await repository.existsById(999);
      expect(result).toBe(false);
    });
  });
});
