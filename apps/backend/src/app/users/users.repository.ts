import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IUser, IUserSummary, RoleCode } from '@cadena24-wms/shared';
import { UserQueryDto } from './dto';
import { toUser, toUserSummary } from './entities/user.entity';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '@cadena24-wms/shared';

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  birthday?: Date | null;
  role?: RoleCode;
  classificationId?: number;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  birthday?: Date | null;
  classificationId?: number | null;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: UserQueryDto): Promise<{ data: IUserSummary[]; total: number }> {
    const page = Number(params.page ?? DEFAULT_PAGE);
    const limit = Math.min(Number(params.limit ?? DEFAULT_LIMIT), 100);
    const skip = (page - 1) * limit;
    const sortBy = params.sortBy ?? 'createdAt';
    const sortOrder = params.sortOrder ?? 'desc';

    const where: Record<string, unknown> = {};

    if (params.role) {
      where['role'] = params.role;
    }

    if (params.search) {
      where['OR'] = [
        { firstName: { contains: params.search } },
        { lastName: { contains: params.search } },
        { email: { contains: params.search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { classification: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users.map(toUserSummary), total };
  }

  async findById(id: number): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { classification: true },
    });
    return user ? toUser(user) : null;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { classification: true },
    });
    return user ? toUser(user) : null;
  }

  async findRawByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findRawById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserData): Promise<IUser> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        birthday: data.birthday ?? null,
        role: data.role ?? 'USER',
        classificationId: data.classificationId ?? null,
      },
      include: { classification: true },
    });
    return toUser(user);
  }

  async update(id: number, data: UpdateUserData): Promise<IUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.birthday !== undefined && { birthday: data.birthday }),
        ...(data.classificationId !== undefined && { classificationId: data.classificationId }),
      },
      include: { classification: true },
    });
    return toUser(user);
  }

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async toggleStatus(id: number): Promise<IUser> {
    const current = await this.prisma.user.findUnique({ where: { id } });
    const user = await this.prisma.user.update({
      where: { id },
      data: { active: !current!.active },
      include: { classification: true },
    });
    return toUser(user);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async existsById(id: number): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { id } });
    return count > 0;
  }

  async updateRefreshToken(id: number, hashedToken: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken: hashedToken },
    });
  }

  async clearRefreshToken(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken: null },
    });
  }
}
