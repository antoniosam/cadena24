import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, QueryProductDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProductDto) {
    const { barcode, ...productData } = data;

    return this.prisma.product.create({
      data: {
        ...productData,
        barcodes: {
          create: {
            barcode: barcode,
            type: 'CODE128',
            isPrimary: true,
          },
        },
      },
      include: {
        barcodes: true,
        classification: true,
      },
    });
  }

  async findAll(query: QueryProductDto) {
    const { search, category, isActive, lowStock, page = 1, limit = 20 } = query;

    const where: Prisma.ProductWhereInput = {};

    // Búsqueda por código, nombre o código de barras
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        {
          barcodes: {
            some: {
              barcode: { contains: search },
            },
          },
        },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Filtrar productos bajo stock mínimo
    if (lowStock) {
      where.inventories = {
        some: {
          availableQuantity: {
            lte: where.minStock as number,
          },
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          barcodes: true,
          classification: true,
          inventories: {
            select: {
              quantity: true,
              availableQuantity: true,
              reservedQuantity: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
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
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        barcodes: true,
        classification: true,
        inventories: {
          include: {
            location: {
              select: {
                fullPath: true,
              },
            },
          },
        },
      },
    });
  }

  async findByCode(code: string) {
    return this.prisma.product.findUnique({
      where: { code },
      include: {
        barcodes: true,
        classification: true,
      },
    });
  }

  async findByBarcode(barcode: string) {
    const productBarcode = await this.prisma.productBarcode.findUnique({
      where: { barcode },
      include: {
        product: {
          include: {
            barcodes: true,
            inventories: {
              select: {
                availableQuantity: true,
                location: {
                  select: {
                    fullPath: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return productBarcode?.product;
  }

  async update(id: number, data: UpdateProductDto) {
    const { barcode, ...updateData } = data;

    // If barcode is being updated
    if (barcode !== undefined) {
      // Get the product's first (primary) barcode
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: { barcodes: { orderBy: { id: 'asc' }, take: 1 } },
      });

      if (product && product.barcodes.length > 0) {
        // Update existing barcode
        await this.prisma.productBarcode.update({
          where: { id: product.barcodes[0].id },
          data: {
            barcode: barcode,
            type: 'CODE128',
            isPrimary: true,
          },
        });
      } else {
        // Create new barcode if product doesn't have one
        await this.prisma.productBarcode.create({
          data: {
            productId: id,
            barcode: barcode,
            type: 'CODE128',
            isPrimary: true,
          },
        });
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        barcodes: true,
        classification: true,
      },
    });
  }

  async delete(id: number) {
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async addBarcode(productId: number, barcode: string, type: string, isPrimary: boolean = false) {
    // Si es primario, desmarcar los demás
    if (isPrimary) {
      await this.prisma.productBarcode.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.productBarcode.create({
      data: {
        productId,
        barcode,
        type,
        isPrimary,
      },
    });
  }

  async removeBarcode(barcodeId: number) {
    return this.prisma.productBarcode.delete({
      where: { id: barcodeId },
    });
  }

  async getLowStockProducts() {
    return this.prisma.product
      .findMany({
        where: {
          isActive: true,
        },
        include: {
          inventories: true,
        },
      })
      .then((products) =>
        products.filter((product) => {
          const totalStock = product.inventories.reduce(
            (sum, inv) => sum + inv.availableQuantity,
            0
          );
          return totalStock < product.minStock;
        })
      );
  }
}
