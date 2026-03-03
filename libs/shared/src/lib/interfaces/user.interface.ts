import { RoleCode } from '../enums/role.enum';

export interface IUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  birthday: string | null;
  role: RoleCode;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUserSummary {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleCode;
  active: boolean;
}

export interface ICreateUser {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  birthday?: string;
  role?: RoleCode;
}

export interface IUpdateUser {
  email?: string;
  firstName?: string;
  lastName?: string;
  birthday?: string | null;
}

export interface IChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IToggleStatus {
  active: boolean;
}
