import { RoleCode } from '../enums/role.enum';
import { Classification } from './classification.interface';

export interface IUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  birthday: string | null;
  role: RoleCode;
  classificationId: number | null;
  classification?: Classification;
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
  classificationId: number | null;
  classification?: Classification;
  active: boolean;
}

export interface ICreateUser {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  birthday?: string;
  role?: RoleCode;
  classificationId?: number;
}

export interface IUpdateUser {
  email?: string;
  firstName?: string;
  lastName?: string;
  birthday?: string | null;
  classificationId?: number | null;
}

export interface IChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IToggleStatus {
  active: boolean;
}
