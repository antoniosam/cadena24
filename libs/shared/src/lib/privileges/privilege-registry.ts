import { PrivilegeLevel } from '../enums/privilege-level.enum';
import { Privilege } from './privilege.class';

export const ALL_PRIVILEGES: Privilege[] = [
  // Users domain
  new Privilege('USERS_READ', 'Ver usuarios', PrivilegeLevel.READ),
  new Privilege('USERS_WRITE', 'Crear/editar usuarios', PrivilegeLevel.WRITE),
  new Privilege('USERS_MANAGE', 'Gestionar usuarios', PrivilegeLevel.MANAGE),
  new Privilege('USERS_ADMIN', 'Administrar usuarios', PrivilegeLevel.ADMIN),

  // Products domain
  new Privilege('PRODUCTS_READ', 'Ver productos', PrivilegeLevel.READ),
  new Privilege('PRODUCTS_WRITE', 'Crear/editar productos', PrivilegeLevel.WRITE),
  new Privilege('PRODUCTS_MANAGE', 'Gestionar productos', PrivilegeLevel.MANAGE),

  // Inventory domain
  new Privilege('INVENTORY_READ', 'Ver inventario', PrivilegeLevel.READ),
  new Privilege('INVENTORY_WRITE', 'Registrar movimientos', PrivilegeLevel.WRITE),
  new Privilege('INVENTORY_MANAGE', 'Gestionar inventario', PrivilegeLevel.MANAGE),

  // Reports domain
  new Privilege('REPORTS_READ', 'Ver reportes', PrivilegeLevel.READ),
  new Privilege('REPORTS_EXPORT', 'Exportar reportes', PrivilegeLevel.WRITE),
  new Privilege('REPORTS_MANAGE', 'Gestionar reportes', PrivilegeLevel.MANAGE),

  // System domain
  new Privilege('SYSTEM_CONFIG', 'Configurar sistema', PrivilegeLevel.ADMIN),
  new Privilege('SYSTEM_LOGS', 'Ver logs del sistema', PrivilegeLevel.MANAGE),
];

export function getAllPrivileges(): Privilege[] {
  return [...ALL_PRIVILEGES];
}

export function getPrivilegeByCode(code: string): Privilege | undefined {
  return ALL_PRIVILEGES.find((p) => p.code === code);
}

export function getPrivilegesByLevel(level: PrivilegeLevel): Privilege[] {
  return ALL_PRIVILEGES.filter((p) => p.level === level);
}
