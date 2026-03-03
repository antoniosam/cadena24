import { RolePrivilegeBuilder } from './role-privilege-builder';
import { RoleCode } from '../enums/role.enum';
import { PrivilegeLevel } from '../enums/privilege-level.enum';
import { ALL_PRIVILEGES } from './privilege-registry';

describe('RolePrivilegeBuilder', () => {
  describe('build()', () => {
    it('should return a non-empty array for USER role', () => {
      const result = RolePrivilegeBuilder.forRole(RoleCode.USER).build();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return more privileges for MANAGER than USER', () => {
      const userPrivs = RolePrivilegeBuilder.forRole(RoleCode.USER).build();
      const managerPrivs = RolePrivilegeBuilder.forRole(RoleCode.MANAGER).build();
      expect(managerPrivs.length).toBeGreaterThan(userPrivs.length);
    });

    it('should return ALL privileges for ADMIN role', () => {
      const adminPrivs = RolePrivilegeBuilder.forRole(RoleCode.ADMIN).build();
      expect(adminPrivs.length).toBe(ALL_PRIVILEGES.length);
    });

    it('USER should have USERS_READ privilege', () => {
      const has = RolePrivilegeBuilder.hasPrivilege(RoleCode.USER, 'USERS_READ');
      expect(has).toBe(true);
    });

    it('USER should NOT have USERS_WRITE privilege', () => {
      const has = RolePrivilegeBuilder.hasPrivilege(RoleCode.USER, 'USERS_WRITE');
      expect(has).toBe(false);
    });

    it('MANAGER should have USERS_WRITE privilege', () => {
      const has = RolePrivilegeBuilder.hasPrivilege(RoleCode.MANAGER, 'USERS_WRITE');
      expect(has).toBe(true);
    });

    it('MANAGER should NOT have SYSTEM_CONFIG privilege', () => {
      const has = RolePrivilegeBuilder.hasPrivilege(RoleCode.MANAGER, 'SYSTEM_CONFIG');
      expect(has).toBe(false);
    });

    it('ADMIN should have SYSTEM_CONFIG privilege', () => {
      const has = RolePrivilegeBuilder.hasPrivilege(RoleCode.ADMIN, 'SYSTEM_CONFIG');
      expect(has).toBe(true);
    });
  });

  describe('buildByLevel()', () => {
    it('should return only READ level privileges for USER', () => {
      const result = RolePrivilegeBuilder.forRole(RoleCode.USER).buildByLevel(PrivilegeLevel.READ);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((p) => expect(p.level).toBe(PrivilegeLevel.READ));
    });

    it('should return only READ level privileges when called on MANAGER', () => {
      const result = RolePrivilegeBuilder.forRole(RoleCode.MANAGER).buildByLevel(
        PrivilegeLevel.READ
      );
      result.forEach((p) => expect(p.level).toBe(PrivilegeLevel.READ));
    });
  });

  describe('buildByMinLevel()', () => {
    it('should exclude READ privileges when minLevel is WRITE', () => {
      const result = RolePrivilegeBuilder.forRole(RoleCode.MANAGER).buildByMinLevel(
        PrivilegeLevel.WRITE
      );
      const hasRead = result.some((p) => p.level === PrivilegeLevel.READ);
      expect(hasRead).toBe(false);
    });

    it('should return only ADMIN level privileges when minLevel is ADMIN for ADMIN role', () => {
      const result = RolePrivilegeBuilder.forRole(RoleCode.ADMIN).buildByMinLevel(
        PrivilegeLevel.ADMIN
      );
      result.forEach((p) => expect(p.level).toBe(PrivilegeLevel.ADMIN));
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array when USER role has no privileges at ADMIN level', () => {
      const result = RolePrivilegeBuilder.forRole(RoleCode.USER).buildByMinLevel(
        PrivilegeLevel.ADMIN
      );
      expect(result.length).toBe(0);
    });
  });

  describe('forRole() static factory', () => {
    it('should return a RolePrivilegeBuilder instance', () => {
      const builder = RolePrivilegeBuilder.forRole(RoleCode.USER);
      expect(builder).toBeInstanceOf(RolePrivilegeBuilder);
    });

    it('should produce the same result as constructor instantiation', () => {
      const fromStatic = RolePrivilegeBuilder.forRole(RoleCode.MANAGER).build();
      const fromCtor = new RolePrivilegeBuilder(RoleCode.MANAGER).build();
      expect(fromStatic.map((p) => p.code)).toEqual(fromCtor.map((p) => p.code));
    });
  });

  describe('hasPrivilege() static method', () => {
    it('should return true when role has the specified privilege', () => {
      expect(RolePrivilegeBuilder.hasPrivilege(RoleCode.ADMIN, 'SYSTEM_CONFIG')).toBe(true);
    });

    it('should return false when role does not have the specified privilege', () => {
      expect(RolePrivilegeBuilder.hasPrivilege(RoleCode.USER, 'USERS_WRITE')).toBe(false);
    });
  });

  describe('global registry consistency', () => {
    it('all returned privileges should exist in the global ALL_PRIVILEGES registry', () => {
      const allCodes = ALL_PRIVILEGES.map((p) => p.code);
      const managerPrivs = RolePrivilegeBuilder.forRole(RoleCode.MANAGER).build();
      managerPrivs.forEach((p) => {
        expect(allCodes).toContain(p.code);
      });
    });

    it('ADMIN role privileges should match ALL_PRIVILEGES exactly', () => {
      const adminCodes = RolePrivilegeBuilder.forRole(RoleCode.ADMIN)
        .build()
        .map((p) => p.code)
        .sort();
      const allCodes = ALL_PRIVILEGES.map((p) => p.code).sort();
      expect(adminCodes).toEqual(allCodes);
    });
  });
});
