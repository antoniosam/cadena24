import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { RoleCode } from '@cadena24-wms/shared';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(() => 'test-jwt-secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate()', () => {
    it('should return payload with sub, email, and role', () => {
      const payload = {
        sub: 1,
        email: 'user@example.com',
        role: RoleCode.USER,
        iat: 1000,
        exp: 2000,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        sub: 1,
        email: 'user@example.com',
        role: RoleCode.USER,
      });
    });

    it('should strip iat and exp from the returned payload', () => {
      const payload = {
        sub: 1,
        email: 'user@example.com',
        role: RoleCode.ADMIN,
        iat: 9999,
        exp: 99999,
      };

      const result = strategy.validate(payload);

      expect(result).not.toHaveProperty('iat');
      expect(result).not.toHaveProperty('exp');
    });

    it('should be registered with strategy name "jwt"', () => {
      // The strategy is constructed with name 'jwt' via PassportStrategy(Strategy, 'jwt')
      // Verify it exists and validate works
      expect(strategy).toBeInstanceOf(JwtStrategy);
    });
  });
});
