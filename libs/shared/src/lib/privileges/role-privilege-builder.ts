import { RoleCode } from '../enums/role.enum';
import { PrivilegeLevel } from '../enums/privilege-level.enum';
import { Privilege } from './privilege.class';
import { ALL_PRIVILEGES, getPrivilegeByCode } from './privilege-registry';

export class RolePrivilegeBuilder {
  private readonly role: RoleCode;

  private readonly rolePrivilegeMap: Record<RoleCode, string[]> = {
    [RoleCode.USER]: ['USERS_READ', 'PRODUCTS_READ', 'INVENTORY_READ', 'REPORTS_READ'],
    [RoleCode.MANAGER]: [
      'USERS_READ',
      'USERS_WRITE',
      'PRODUCTS_READ',
      'PRODUCTS_WRITE',
      'INVENTORY_READ',
      'INVENTORY_WRITE',
      'INVENTORY_MANAGE',
      'REPORTS_READ',
      'REPORTS_EXPORT',
      'SYSTEM_LOGS',
    ],
    [RoleCode.ADMIN]: ALL_PRIVILEGES.map((p) => p.code),
  };

  constructor(role: RoleCode) {
    this.role = role;
  }

  /** Returns all privileges assigned to this role */
  build(): Privilege[] {
    const codes = this.rolePrivilegeMap[this.role] ?? [];
    return codes
      .map((code) => getPrivilegeByCode(code))
      .filter((p): p is Privilege => p !== undefined);
  }

  /** Returns privileges filtered by minimum level (inclusive) */
  buildByMinLevel(minLevel: PrivilegeLevel): Privilege[] {
    return this.build().filter((p) => p.level >= minLevel);
  }

  /** Returns privileges filtered by exact level */
  buildByLevel(level: PrivilegeLevel): Privilege[] {
    return this.build().filter((p) => p.level === level);
  }

  /** Static convenience factory */
  static forRole(role: RoleCode): RolePrivilegeBuilder {
    return new RolePrivilegeBuilder(role);
  }

  /** Check if a role has a specific privilege code */
  static hasPrivilege(role: RoleCode, code: string): boolean {
    return new RolePrivilegeBuilder(role).build().some((p) => p.code === code);
  }
}
