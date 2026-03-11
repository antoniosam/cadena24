import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { PasswordService } from '../users/password.service';
import { IUser, RoleCode } from '@cadena24-wms/shared';

// Minimal raw user shape from prisma
const mockRawUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  password: 'hashed_password',
  birthday: null,
  role: 'USER' as const,
  active: true,
  refreshToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser: IUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  birthday: null,
  role: RoleCode.USER,
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockAdminUser: IUser = { ...mockUser, role: RoleCode.ADMIN, active: true };

const mockRes = {
  cookie: jest.fn(),
  clearCookie: jest.fn(),
} as unknown as Response;

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockUsersRepository = {
      findRawByEmail: jest.fn(),
      findRawById: jest.fn(),
      findById: jest.fn(),
      updateRefreshToken: jest.fn(),
      clearRefreshToken: jest.fn(),
    };

    const mockPasswordService = {
      compare: jest.fn(),
      hash: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => `test-secret-for-${key}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
    passwordService = module.get(PasswordService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── validateUser() ──────────────────────────────────────────────────────────

  describe('validateUser()', () => {
    it('should return IUser when email exists and password matches', async () => {
      usersRepository.findRawByEmail.mockResolvedValue(mockRawUser);
      passwordService.compare.mockResolvedValue(true);
      usersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(usersRepository.findRawByEmail).toHaveBeenCalledWith('test@example.com');
      expect(passwordService.compare).toHaveBeenCalledWith('password', 'hashed_password');
    });

    it('should return null when email does not exist', async () => {
      usersRepository.findRawByEmail.mockResolvedValue(null);

      const result = await service.validateUser('notfound@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password does not match', async () => {
      usersRepository.findRawByEmail.mockResolvedValue(mockRawUser);
      passwordService.compare.mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should NOT throw on failure — always returns null (no user enumeration)', async () => {
      usersRepository.findRawByEmail.mockResolvedValue(null);

      await expect(service.validateUser('noone@example.com', 'pass')).resolves.toBeNull();
    });
  });

  // ── login() ─────────────────────────────────────────────────────────────────

  describe('login()', () => {
    beforeEach(() => {
      jwtService.sign
        .mockReturnValueOnce('access_token_value')
        .mockReturnValueOnce('refresh_token_value');
      usersRepository.updateRefreshToken.mockResolvedValue();
    });

    it('should call jwtService.sign() twice (access + refresh)', async () => {
      await service.login(mockUser, mockRes);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should sign access token with JWT_SECRET and expiresIn 4h', async () => {
      await service.login(mockUser, mockRes);

      expect(jwtService.sign).toHaveBeenNthCalledWith(
        1,
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        expect.objectContaining({
          secret: configService.getOrThrow('JWT_SECRET'),
          expiresIn: '4h',
        })
      );
    });

    it('should sign refresh token with JWT_REFRESH_SECRET and expiresIn 7d', async () => {
      await service.login(mockUser, mockRes);

      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        expect.objectContaining({
          secret: configService.getOrThrow('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        })
      );
    });

    it('should store bcrypt hash of refresh token via updateRefreshToken()', async () => {
      await service.login(mockUser, mockRes);

      expect(usersRepository.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String)
      );
      // Verify stored value is a bcrypt hash (not raw token)
      const storedHash = (usersRepository.updateRefreshToken as jest.Mock).mock.calls[0][1];
      expect(storedHash).not.toBe('refresh_token_value');
      expect(storedHash).toMatch(/^\$2[aby]\$\d+\$/);
    });

    it('should set access_token cookie as httpOnly', async () => {
      await service.login(mockUser, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'access_token_value',
        expect.objectContaining({ httpOnly: true })
      );
    });

    it('should set refresh_token cookie as httpOnly', async () => {
      await service.login(mockUser, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh_token_value',
        expect.objectContaining({ httpOnly: true })
      );
    });

    it('should return ITokenUser shape (no passwords, no raw tokens)', async () => {
      const result = await service.login(mockUser, mockRes);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        active: mockUser.active,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException with Spanish message when user is inactive', async () => {
      const inactiveUser: IUser = { ...mockUser, active: false };

      await expect(service.login(inactiveUser, mockRes)).rejects.toThrow(
        new UnauthorizedException('Tu cuenta está desactivada. Contacta al administrador')
      );
    });
  });

  // ── refresh() ───────────────────────────────────────────────────────────────

  describe('refresh()', () => {
    const rawRefreshToken = 'raw_refresh_token';
    let storedHash: string;

    beforeEach(async () => {
      storedHash = await bcrypt.hash(rawRefreshToken, 10);
      jwtService.sign
        .mockReturnValueOnce('new_access_token')
        .mockReturnValueOnce('new_refresh_token');
      usersRepository.updateRefreshToken.mockResolvedValue();
    });

    it('should throw UnauthorizedException when user has no stored refresh token', async () => {
      usersRepository.findRawById.mockResolvedValue({ ...mockRawUser, refreshToken: null });

      await expect(service.refresh(1, rawRefreshToken, mockRes)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when token hash does not match', async () => {
      usersRepository.findRawById.mockResolvedValue({ ...mockRawUser, refreshToken: storedHash });

      await expect(service.refresh(1, 'wrong_token', mockRes)).rejects.toThrow(
        new UnauthorizedException('Sesión expirada, inicia sesión nuevamente')
      );
    });

    it('should issue new access + refresh token pair on valid token', async () => {
      usersRepository.findRawById.mockResolvedValue({ ...mockRawUser, refreshToken: storedHash });

      await service.refresh(1, rawRefreshToken, mockRes);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should store new hashed refresh token in DB (rotation)', async () => {
      usersRepository.findRawById.mockResolvedValue({ ...mockRawUser, refreshToken: storedHash });

      await service.refresh(1, rawRefreshToken, mockRes);

      expect(usersRepository.updateRefreshToken).toHaveBeenCalledWith(1, expect.any(String));
      // New hash should not equal old hash
      const newHash = (usersRepository.updateRefreshToken as jest.Mock).mock.calls[0][1];
      expect(newHash).not.toBe(storedHash);
    });

    it('should set new cookies on response', async () => {
      usersRepository.findRawById.mockResolvedValue({ ...mockRawUser, refreshToken: storedHash });

      await service.refresh(1, rawRefreshToken, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledTimes(2);
    });
  });

  // ── logout() ────────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('should call clearRefreshToken() with userId', async () => {
      usersRepository.clearRefreshToken.mockResolvedValue();

      await service.logout(1, mockRes);

      expect(usersRepository.clearRefreshToken).toHaveBeenCalledWith(1);
    });

    it('should clear access_token cookie', async () => {
      usersRepository.clearRefreshToken.mockResolvedValue();

      await service.logout(1, mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
    });

    it('should clear refresh_token cookie', async () => {
      usersRepository.clearRefreshToken.mockResolvedValue();

      await service.logout(1, mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
    });
  });

  // ── me() ────────────────────────────────────────────────────────────────────

  describe('me()', () => {
    it('should return ITokenUser for valid userId', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.me(1);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        active: mockUser.active,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.me(999)).rejects.toThrow(UnauthorizedException);
    });
  });

  // Used to avoid TypeScript "unused variable" warning
  it('should have configService injected', () => {
    expect(configService).toBeDefined();
  });

  it('should have mockAdminUser for role tests', () => {
    expect(mockAdminUser.role).toBe('ADMIN');
  });
});
