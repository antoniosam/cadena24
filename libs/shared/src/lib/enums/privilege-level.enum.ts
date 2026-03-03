export enum PrivilegeLevel {
  READ = 1,
  WRITE = 2,
  MANAGE = 3,
  ADMIN = 4,
}

export const PRIVILEGE_LEVEL_LABELS: Record<PrivilegeLevel, string> = {
  [PrivilegeLevel.READ]: 'Lectura',
  [PrivilegeLevel.WRITE]: 'Escritura',
  [PrivilegeLevel.MANAGE]: 'Gestión',
  [PrivilegeLevel.ADMIN]: 'Administración',
};
