import { IUser, IUserSummary, RoleCode } from '@cadena24-wms/shared';

type PrismaUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  birthday: Date | null;
  role: string;
  active: boolean;
  classificationId?: number | null;
  classification?: any;
  refreshToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Maps a Prisma User row to the IUser interface (password excluded) */
export function toUser(user: PrismaUser): IUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    birthday: user.birthday ? user.birthday.toISOString() : null,
    role: user.role as RoleCode,
    active: user.active,
    classificationId: user.classificationId ?? null,
    classification: user.classification,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/** Maps a Prisma User row to the IUserSummary interface */
export function toUserSummary(user: PrismaUser): IUserSummary {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as RoleCode,
    classificationId: user.classificationId ?? null,
    classification: user.classification,
    active: user.active,
  };
}
