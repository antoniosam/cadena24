import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import { CreateProviderDto, UpdateProviderDto, ProviderQueryDto } from './dto/providers.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProvidersRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProviderDto) {
    return this.prisma.provider.create({
      data,
    });
  }

  async findAll(query: ProviderQueryDto) {
    const { search, isActive, page = 1, limit = 20 } = query;

    const where: Prisma.ProviderWhereInput = {};

    if (search) {
      where.OR = [{ code: { contains: search } }, { name: { contains: search } }];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [items, total] = await Promise.all([
      this.prisma.provider.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.provider.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    return this.prisma.provider.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string) {
    return this.prisma.provider.findUnique({
      where: { code },
    });
  }

  async update(id: number, data: UpdateProviderDto) {
    return this.prisma.provider.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.provider.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
