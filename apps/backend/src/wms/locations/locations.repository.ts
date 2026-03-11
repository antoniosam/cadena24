import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationDto } from './dto/query-location.dto';

@Injectable()
export class LocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateLocationDto) {
    // Get warehouse to build fullPath
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: data.warehouseId },
      select: { code: true },
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    const fullPath = `${warehouse.code}/${data.zone}/${data.row}/${data.position}/${data.level}`;

    return this.prisma.location.create({
      data: {
        ...data,
        fullPath,
      },
      include: {
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryLocationDto) {
    const {
      warehouseId,
      zone,
      type,
      isActive,
      search,
      barcode,
      availableOnly,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (zone) {
      where.zone = zone;
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (barcode) {
      where.barcode = { contains: barcode, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { fullPath: { contains: search, mode: 'insensitive' } },
        { zone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (availableOnly) {
      // Locations with available capacity (capacity > 0)
      where.capacity = { gt: 0 };
    }

    const [items, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ fullPath: 'asc' }],
        include: {
          warehouse: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.location.count({ where }),
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
    return this.prisma.location.findUnique({
      where: { id },
      include: {
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
        _count: {
          select: {
            inventories: true,
          },
        },
      },
    });
  }

  async findByBarcode(barcode: string) {
    return this.prisma.location.findUnique({
      where: { barcode },
      include: {
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  async findByWarehouse(warehouseId: number) {
    const locations = await this.prisma.location.findMany({
      where: { warehouseId, isActive: true },
      orderBy: [{ zone: 'asc' }, { row: 'asc' }, { position: 'asc' }, { level: 'asc' }],
    });

    // Group hierarchically for tree view
    const tree: any[] = [];
    const zoneMap = new Map<string, any>();

    for (const location of locations) {
      // Get or create zone
      if (!zoneMap.has(location.zone)) {
        const zoneNode = {
          zone: location.zone,
          rows: [],
        };
        zoneMap.set(location.zone, zoneNode);
        tree.push(zoneNode);
      }
      const zoneNode = zoneMap.get(location.zone);

      // Get or create row
      let rowNode = zoneNode.rows.find((r: any) => r.row === location.row);
      if (!rowNode) {
        rowNode = {
          row: location.row,
          positions: [],
        };
        zoneNode.rows.push(rowNode);
      }

      // Get or create position
      let positionNode = rowNode.positions.find((p: any) => p.position === location.position);
      if (!positionNode) {
        positionNode = {
          position: location.position,
          levels: [],
        };
        rowNode.positions.push(positionNode);
      }

      // Add location to levels
      positionNode.levels.push(location);
    }

    return tree;
  }

  async update(id: number, data: UpdateLocationDto) {
    // Check if zone/row/position/level changed to regenerate fullPath
    const needsFullPathUpdate =
      data.zone !== undefined ||
      data.row !== undefined ||
      data.position !== undefined ||
      data.level !== undefined;

    if (needsFullPathUpdate) {
      // Get current location and warehouse
      const current = await this.prisma.location.findUnique({
        where: { id },
        include: {
          warehouse: {
            select: { code: true },
          },
        },
      });

      if (!current) {
        throw new Error('Location not found');
      }

      const zone = data.zone ?? current.zone;
      const row = data.row ?? current.row;
      const position = data.position ?? current.position;
      const level = data.level ?? current.level;
      const fullPath = `${current.warehouse.code}/${zone}/${row}/${position}/${level}`;

      return this.prisma.location.update({
        where: { id },
        data: {
          ...data,
          fullPath,
        },
        include: {
          warehouse: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });
    }

    return this.prisma.location.update({
      where: { id },
      data,
      include: {
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  async findByProduct(productId: number, warehouseId?: number) {
    const where: any = {
      isActive: true,
      inventories: {
        some: {
          productId,
          quantity: { gt: 0 },
        },
      },
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    return this.prisma.location.findMany({
      where,
      orderBy: [{ fullPath: 'asc' }],
      include: {
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        inventories: {
          where: { productId },
          select: {
            quantity: true,
            availableQuantity: true,
            reservedQuantity: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    return this.prisma.location.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
