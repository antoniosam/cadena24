import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ITokenPayload, ITokenUser, IUser, RoleCode } from '@cadena24-wms/shared';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { Reflector } from '@nestjs/core';

const mockTokenUser: ITokenUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: RoleCode.USER,
  active: true,
};

const mockUser: IUser = {
  ...mockTokenUser,
  birthday: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockRes = {
  cookie: jest.fn(),
  clearCookie: jest.fn(),
} as unknown as Response;

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      me: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }, Reflector],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── POST /auth/login ────────────────────────────────────────────────────────

  describe('login()', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should call authService.validateUser() with email and password', async () => {
      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockTokenUser);

      await controller.login(loginDto as never, mockRes);

      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });

    it('should throw UnauthorizedException when validateUser() returns null', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto as never, mockRes)).rejects.toThrow(
        new UnauthorizedException('Credenciales incorrectas')
      );
    });

    it('should call authService.login() with valid user', async () => {
      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockTokenUser);

      await controller.login(loginDto as never, mockRes);

      expect(authService.login).toHaveBeenCalledWith(mockUser, mockRes);
    });

    it('should return ApiResponse<ITokenUser> on success', async () => {
      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockTokenUser);

      const result = await controller.login(loginDto as never, mockRes);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTokenUser);
      expect(result.timestamp).toBeDefined();
    });

    it('POST /auth/login should be decorated with @Public()', () => {
      const loginMethod = Object.getOwnPropertyDescriptor(AuthController.prototype, 'login');
      // Verify the @Public() metadata is set on the method
      const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, loginMethod?.value);
      expect(metadata).toBe(true);
    });
  });

  // ── POST /auth/refresh ──────────────────────────────────────────────────────

  describe('refresh()', () => {
    const refreshUser = { sub: 1, refreshToken: 'raw_refresh_token' };

    it('should call authService.refresh() with userId and rawToken', async () => {
      authService.refresh.mockResolvedValue(mockTokenUser);

      await controller.refresh(refreshUser as never, mockRes);

      expect(authService.refresh).toHaveBeenCalledWith(
        refreshUser.sub,
        refreshUser.refreshToken,
        mockRes
      );
    });

    it('should propagate UnauthorizedException from service', async () => {
      authService.refresh.mockRejectedValue(
        new UnauthorizedException('Sesión expirada, inicia sesión nuevamente')
      );

      await expect(controller.refresh(refreshUser as never, mockRes)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  // ── POST /auth/logout ───────────────────────────────────────────────────────

  describe('logout()', () => {
    const tokenPayload: ITokenPayload = {
      sub: 1,
      email: 'test@example.com',
      role: RoleCode.USER,
    };

    it('should call authService.logout() with current user id', async () => {
      authService.logout.mockResolvedValue();

      await controller.logout(tokenPayload, mockRes);

      expect(authService.logout).toHaveBeenCalledWith(tokenPayload.sub, mockRes);
    });

    it('should return ApiResponse<null>', async () => {
      authService.logout.mockResolvedValue();

      const result = await controller.logout(tokenPayload, mockRes);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.timestamp).toBeDefined();
    });
  });

  // ── GET /auth/me ────────────────────────────────────────────────────────────

  describe('me()', () => {
    const tokenPayload: ITokenPayload = {
      sub: 1,
      email: 'test@example.com',
      role: RoleCode.USER,
    };

    it('should call authService.me() with current user id', async () => {
      authService.me.mockResolvedValue(mockTokenUser);

      await controller.me(tokenPayload);

      expect(authService.me).toHaveBeenCalledWith(tokenPayload.sub);
    });

    it('should return ApiResponse<ITokenUser>', async () => {
      authService.me.mockResolvedValue(mockTokenUser);

      const result = await controller.me(tokenPayload);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTokenUser);
    });
  });
});
