import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../app/prisma/prisma.service';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private prisma: PrismaService) {}

  async getAlerts() {
    return this.prisma.alert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: number) {
    return this.prisma.alert.update({
      where: { id },
      data: { isRead: true },
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkLowStock() {
    this.logger.log('Checking low stock products...');
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { inventories: true },
    });

    for (const product of products) {
      const totalStock = product.inventories.reduce((sum, inv) => sum + inv.availableQuantity, 0);

      if (totalStock < product.minStock) {
        // Check if alert already exists for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await this.prisma.alert.findFirst({
          where: {
            type: 'LOW_STOCK',
            productId: product.id,
            createdAt: { gte: today },
          },
        });

        if (!existing) {
          await this.prisma.alert.create({
            data: {
              type: 'LOW_STOCK',
              severity: totalStock === 0 ? 'critical' : 'high',
              title: `Low Stock: ${product.name}`,
              message: `Product ${product.code} has only ${totalStock} units (min: ${product.minStock})`,
              productId: product.id,
              suggestedActions: JSON.stringify([
                'Create Purchase Order',
                `Order ${product.reorderQuantity} units`,
              ]),
            },
          });
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkOrderDelays() {
    this.logger.log('Checking delayed orders...');
    const now = new Date();
    const delayedOrders = await this.prisma.salesOrder.findMany({
      where: {
        status: { in: ['pending', 'picking'] },
        requiredDate: { lt: now },
      },
    });

    for (const order of delayedOrders) {
      const existing = await this.prisma.alert.findFirst({
        where: {
          type: 'ORDER_DELAYED',
          orderId: order.id,
          isRead: false,
        },
      });

      if (!existing) {
        await this.prisma.alert.create({
          data: {
            type: 'ORDER_DELAYED',
            severity: 'high',
            title: `Delayed Order: ${order.orderNumber}`,
            message: `Order was due on ${order.requiredDate?.toLocaleDateString()}`,
            orderId: order.id,
            suggestedActions: JSON.stringify(['Prioritize Picking', 'Contact Customer']),
          },
        });
      }
    }
  }
}
