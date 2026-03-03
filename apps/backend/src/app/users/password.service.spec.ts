import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PasswordService } from './password.service';
import { ChangePasswordDto } from './dto';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── hash() ────────────────────────────────────────────────────────────────

  describe('hash()', () => {
    it('should return a string different from the plain-text input', async () => {
      const plain = 'MyPassword1';
      const hashed = await service.hash(plain);
      expect(hashed).not.toBe(plain);
    });

    it('should return a bcrypt hash starting with $2b$', async () => {
      const hashed = await service.hash('MyPassword1');
      expect(hashed.startsWith('$2b$')).toBe(true);
    });

    it('should produce different hashes for the same password (salt)', async () => {
      const plain = 'MyPassword1';
      const hash1 = await service.hash(plain);
      const hash2 = await service.hash(plain);
      expect(hash1).not.toBe(hash2);
    });
  });

  // ── compare() ─────────────────────────────────────────────────────────────

  describe('compare()', () => {
    it('should return true when plain password matches the hash', async () => {
      const plain = 'MyPassword1';
      const hashed = await service.hash(plain);
      const result = await service.compare(plain, hashed);
      expect(result).toBe(true);
    });

    it('should return false when plain password does not match the hash', async () => {
      const hashed = await service.hash('MyPassword1');
      const result = await service.compare('WrongPassword9', hashed);
      expect(result).toBe(false);
    });
  });

  // ── validate() ────────────────────────────────────────────────────────────

  describe('validate()', () => {
    it('should NOT throw when newPassword and confirmPassword match', () => {
      const dto: ChangePasswordDto = {
        currentPassword: 'OldPass1',
        newPassword: 'NewPass1',
        confirmPassword: 'NewPass1',
      };
      expect(() => service.validate(dto)).not.toThrow();
    });

    it('should throw BadRequestException when passwords do not match', () => {
      const dto: ChangePasswordDto = {
        currentPassword: 'OldPass1',
        newPassword: 'NewPass1',
        confirmPassword: 'DifferentPass1',
      };
      expect(() => service.validate(dto)).toThrow(BadRequestException);
    });

    it('should throw with Spanish error message when passwords do not match', () => {
      const dto: ChangePasswordDto = {
        currentPassword: 'OldPass1',
        newPassword: 'NewPass1',
        confirmPassword: 'DifferentPass1',
      };
      expect(() => service.validate(dto)).toThrow('Las contraseñas no coinciden');
    });
  });
});
