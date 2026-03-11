import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { ITokenPayload, ITokenUser, IUser } from '@cadena24-wms/shared';
import { UsersRepository } from '../users/users.repository';
import { PasswordService } from '../users/password.service';
import { COOKIE_OPTIONS_ACCESS, COOKIE_OPTIONS_REFRESH } from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  /**
   * Validates user credentials. Returns user or null (never throws — no enumeration).
   */
  async validateUser(email: string, password: string): Promise<IUser | null> {
    const raw = await this.usersRepository.findRawByEmail(email);
    if (!raw) return null;

    const passwordMatch = await this.passwordService.compare(password, raw.password);
    if (!passwordMatch) return null;

    return this.usersRepository.findById(raw.id);
  }

  /**
   * Issues access + refresh token pair.
   * Stores hashed refresh token in DB.
   * Sets both tokens as HTTP-only cookies on the response.
   */
  async login(user: IUser, res: Response): Promise<ITokenUser> {
    if (!user.active) {
      throw new UnauthorizedException('Tu cuenta está desactivada. Contacta al administrador');
    }

    const { accessToken, refreshToken } = this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.updateRefreshToken(user.id, hashedRefresh);

    this.setCookies(res, accessToken, refreshToken);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      active: user.active,
    };
  }

  /**
   * Validates the refresh token (compares bcrypt hash in DB).
   * Rotates: issues new access + refresh token pair.
   */
  async refresh(userId: number, rawRefreshToken: string, res: Response): Promise<ITokenUser> {
    const raw = await this.usersRepository.findRawById(userId);

    if (!raw || !raw.refreshToken) {
      throw new UnauthorizedException('Sesión expirada, inicia sesión nuevamente');
    }

    const tokenMatch = await bcrypt.compare(rawRefreshToken, raw.refreshToken);
    if (!tokenMatch) {
      throw new UnauthorizedException('Sesión expirada, inicia sesión nuevamente');
    }

    const { accessToken, refreshToken } = this.generateTokens({
      sub: raw.id,
      email: raw.email,
      role: raw.role as ITokenPayload['role'],
    });

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.updateRefreshToken(raw.id, hashedRefresh);

    this.setCookies(res, accessToken, refreshToken);

    return {
      id: raw.id,
      email: raw.email,
      firstName: raw.firstName,
      lastName: raw.lastName,
      role: raw.role as ITokenPayload['role'],
      active: raw.active,
    };
  }

  /**
   * Clears refresh token from DB and clears both cookies.
   */
  async logout(userId: number, res: Response): Promise<void> {
    await this.usersRepository.clearRefreshToken(userId);
    this.clearCookies(res);
  }

  /**
   * Returns the current user from DB given the token payload sub.
   */
  async me(userId: number): Promise<ITokenUser> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('No autorizado');
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      active: user.active,
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private generateTokens(payload: ITokenPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: '4h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie('access_token', accessToken, COOKIE_OPTIONS_ACCESS);
    res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS_REFRESH);
  }

  private clearCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth' });
  }
}
