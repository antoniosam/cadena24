export enum RoleCode {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
}

export const ROLE_LABELS: Record<RoleCode, string> = {
  [RoleCode.USER]: 'Usuario',
  [RoleCode.ADMIN]: 'Administrador',
  [RoleCode.MANAGER]: 'Gerente',
};
