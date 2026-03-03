import {
  getAllPrivileges,
  getPrivilegeByCode,
  getPrivilegesByLevel,
  ALL_PRIVILEGES,
} from './privilege-registry';
import { PrivilegeLevel } from '../enums/privilege-level.enum';

describe('PrivilegeRegistry', () => {
  describe('getAllPrivileges()', () => {
    it('should return an array', () => {
      const result = getAllPrivileges();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return a copy — mutating it does not affect the registry', () => {
      const copy = getAllPrivileges();
      const originalLength = copy.length;
      copy.pop();
      expect(getAllPrivileges().length).toBe(originalLength);
    });

    it('should have the expected total count', () => {
      expect(getAllPrivileges().length).toBe(15);
    });

    it('should have all unique codes', () => {
      const codes = getAllPrivileges().map((p) => p.code);
      const unique = new Set(codes);
      expect(unique.size).toBe(codes.length);
    });
  });

  describe('getPrivilegeByCode()', () => {
    it('should return the correct privilege for a valid code', () => {
      const p = getPrivilegeByCode('USERS_READ');
      expect(p).toBeDefined();
      expect(p!.code).toBe('USERS_READ');
      expect(p!.level).toBe(PrivilegeLevel.READ);
    });

    it('should return undefined for an unknown code', () => {
      expect(getPrivilegeByCode('NON_EXISTENT')).toBeUndefined();
    });

    it('should return the correct privilege for SYSTEM_CONFIG', () => {
      const p = getPrivilegeByCode('SYSTEM_CONFIG');
      expect(p).toBeDefined();
      expect(p!.level).toBe(PrivilegeLevel.ADMIN);
    });
  });

  describe('getPrivilegesByLevel()', () => {
    it('should return only READ privileges when filtering by READ', () => {
      const result = getPrivilegesByLevel(PrivilegeLevel.READ);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((p) => expect(p.level).toBe(PrivilegeLevel.READ));
    });

    it('should return only ADMIN privileges when filtering by ADMIN', () => {
      const result = getPrivilegesByLevel(PrivilegeLevel.ADMIN);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((p) => expect(p.level).toBe(PrivilegeLevel.ADMIN));
    });

    it('should not include READ privileges when filtering by WRITE', () => {
      const result = getPrivilegesByLevel(PrivilegeLevel.WRITE);
      const hasRead = result.some((p) => p.level === PrivilegeLevel.READ);
      expect(hasRead).toBe(false);
    });
  });

  describe('ALL_PRIVILEGES constant', () => {
    it('should contain USERS_READ privilege', () => {
      const codes = ALL_PRIVILEGES.map((p) => p.code);
      expect(codes).toContain('USERS_READ');
    });

    it('should contain SYSTEM_CONFIG privilege', () => {
      const codes = ALL_PRIVILEGES.map((p) => p.code);
      expect(codes).toContain('SYSTEM_CONFIG');
    });
  });
});
