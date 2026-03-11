import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import { CreateClientDto, UpdateClientDto, QueryClientsDto } from './dto/clients.dto';

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClientDto) {
    return (this.prisma as any).client.create({
      data,
    });
  }

  async findAll(query: QueryClientsDto) {
    const { search, isActive, page = 1, limit = 20 } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [items, total] = await Promise.all([
      (this.prisma as any).client.findMany({
        where,
        skip: (page - 1) * (limit || 20),
        take: limit || 20,
        orderBy: { name: 'asc' },
      }),
      (this.prisma as any).client.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / (limit || 20)),
    };
  }

  async findOne(id: number) {
    return (this.prisma as any).client.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string) {
    return (this.prisma as any).client.findUnique({
      where: { code },
    });
  }

  async update(id: number, data: UpdateClientDto) {
    return (this.prisma as any).client.update({
      where: { id },
      data,
    });
  }
}
