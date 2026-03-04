import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ITokenPayload } from '@cadena24-wms/shared';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['refresh_token'] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true, // we need access to the raw token
    });
  }

  validate(req: Request, payload: ITokenPayload): { sub: number; refreshToken: string } {
    const refreshToken = req.cookies?.['refresh_token'] as string;
    return { sub: payload.sub, refreshToken };
  }
}
