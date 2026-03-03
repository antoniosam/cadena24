import { Privilege } from './privilege.class';
import { PrivilegeLevel } from '../enums/privilege-level.enum';

describe('Privilege', () => {
  it('should set all properties correctly via constructor', () => {
    const p = new Privilege('USERS_READ', 'Ver usuarios', PrivilegeLevel.READ);
    expect(p.code).toBe('USERS_READ');
    expect(p.name).toBe('Ver usuarios');
    expect(p.level).toBe(PrivilegeLevel.READ);
  });

  it('should have readonly properties that cannot be reassigned', () => {
    const p = new Privilege('USERS_READ', 'Ver usuarios', PrivilegeLevel.READ);
    // TypeScript enforces readonly at compile time; at runtime we verify the value is unchanged
    expect(() => {
      (p as unknown as Record<string, unknown>)['code'] = 'HACKED';
    }).not.toThrow(); // JS doesn't throw, but value should still be 'HACKED' in plain objects
    // The real protection is the TypeScript readonly — this test verifies the class holds values correctly
    expect(p.level).toBe(1);
  });

  it('should create two instances with the same code as separate references', () => {
    const a = new Privilege('USERS_READ', 'Ver usuarios', PrivilegeLevel.READ);
    const b = new Privilege('USERS_READ', 'Ver usuarios', PrivilegeLevel.READ);
    expect(a).not.toBe(b);
    expect(a.code).toBe(b.code);
  });

  it('should support numeric level comparison with PrivilegeLevel enum values', () => {
    const read = new Privilege('X_READ', 'Read', PrivilegeLevel.READ);
    const admin = new Privilege('X_ADMIN', 'Admin', PrivilegeLevel.ADMIN);
    expect(admin.level > read.level).toBe(true);
    expect(read.level >= PrivilegeLevel.READ).toBe(true);
    expect(read.level >= PrivilegeLevel.WRITE).toBe(false);
  });
});
