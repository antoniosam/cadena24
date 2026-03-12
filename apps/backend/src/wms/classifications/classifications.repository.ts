import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import {
  CreateClassificationDto,
  UpdateClassificationDto,
  ClassificationQueryDto,
} from './dto/classifications.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClassificationsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateClassificationDto) {
    return this.prisma.classification.create({
      data,
    });
  }

  async findAll(query: ClassificationQueryDto) {
    const { search, isActive, page = 1, limit = 20 } = query;

    const where: Prisma.ClassificationWhereInput = {};

    if (search) {
      where.OR = [{ code: { contains: search } }, { name: { contains: search } }];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [items, total] = await Promise.all([
      this.prisma.classification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.classification.count({ where }),
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
    return this.prisma.classification.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string) {
    return this.prisma.classification.findUnique({
      where: { code },
    });
  }

  async update(id: number, data: UpdateClassificationDto) {
    return this.prisma.classification.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.classification.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
