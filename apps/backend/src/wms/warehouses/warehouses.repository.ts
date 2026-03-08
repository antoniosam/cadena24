import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { QueryWarehouseDto } from './dto/query-warehouse.dto';

@Injectable()
export class WarehousesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateWarehouseDto) {
    return this.prisma.warehouse.create({
      data,
    });
  }

  async findAll(query: QueryWarehouseDto) {
    const { search, isActive, isPrimary, page = 1, limit = 20 } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isPrimary !== undefined) {
      where.isPrimary = isPrimary;
    }

    const [items, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isPrimary: 'desc' }, { code: 'asc' }],
      }),
      this.prisma.warehouse.count({ where }),
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
    return this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            locations: true,
            inventories: true,
          },
        },
      },
    });
  }

  async findByCode(code: string) {
    return this.prisma.warehouse.findUnique({
      where: { code },
    });
  }

  async findPrimary() {
    return this.prisma.warehouse.findFirst({
      where: { isPrimary: true, isActive: true },
    });
  }

  async update(id: number, data: UpdateWarehouseDto) {
    // If setting isPrimary to true, unset all others
    if (data.isPrimary === true) {
      await this.prisma.warehouse.updateMany({
        where: { isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.warehouse.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
