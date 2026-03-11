import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import {
  DashboardKPIs,
  StockByCategory,
  DailyMovements,
  TopProducts,
  OrdersByStatus,
  WarehouseOccupancy,
} from '@cadena24-wms/shared';

@Injectable()
export class DashboardRepository {
  constructor(private prisma: PrismaService) {}

  async getKPIs(): Promise<DashboardKPIs> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      totalStockResult,
      lowStockProducts,
      pendingOrders,
      ordersToday,
      ordersFulfilledToday,
      receivingsToday,
      picksToday,
      movementsToday,
      totalLocations,
      occupiedLocationsResult,
    ] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.inventory.aggregate({
        _sum: { availableQuantity: true },
      }),
      this.prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          minStock: true,
          inventories: {
            select: { availableQuantity: true },
          },
        },
      }),
      this.prisma.salesOrder.count({ where: { status: 'pending' } }),
      this.prisma.salesOrder.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.salesOrder.count({
        where: {
          status: 'shipped',
          shippedDate: { gte: todayStart },
        },
      }),
      this.prisma.receivingOrder.count({
        where: {
          status: 'received',
          receivedDate: { gte: todayStart },
        },
      }),
      this.prisma.pickList.count({
        where: {
          status: 'completed',
          completedAt: { gte: todayStart },
        },
      }),
      this.prisma.movementOrder.count({
        where: {
          status: 'completed',
          completedAt: { gte: todayStart },
        },
      }),
      this.prisma.location.count({ where: { isActive: true } }),
      this.prisma.inventory.groupBy({
        by: ['locationId'],
        _sum: { quantity: true },
        having: { quantity: { _sum: { gt: 0 } } },
      }),
    ]);

    const totalStock = totalStockResult._sum.availableQuantity || 0;
    const lowStockAlerts = lowStockProducts.filter((p) => {
      const stock = p.inventories.reduce((sum, inv) => sum + inv.availableQuantity, 0);
      return stock < p.minStock;
    }).length;

    const occupiedLocations = occupiedLocationsResult.length;
    const utilizationRate = totalLocations > 0 ? (occupiedLocations / totalLocations) * 100 : 0;

    return {
      totalProducts,
      totalStock,
      stockValue: totalStock * 10, // Dummy multiplier for value
      lowStockAlerts,
      pendingOrders,
      ordersToday,
      ordersFulfilled: ordersFulfilledToday,
      receivingsToday,
      picksToday,
      movementsToday,
      totalLocations,
      occupiedLocations,
      utilizationRate,
    };
  }

  async getStockByCategory(): Promise<StockByCategory[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        category: true,
        inventories: {
          select: { availableQuantity: true },
        },
      },
    });

    const categoryMap = new Map<string, { quantity: number; value: number }>();
    let totalQuantity = 0;

    products.forEach((p) => {
      const cat = p.category || 'Uncategorized';
      const qty = p.inventories.reduce((sum, inv) => sum + inv.availableQuantity, 0);
      const current = categoryMap.get(cat) || { quantity: 0, value: 0 };
      categoryMap.set(cat, {
        quantity: current.quantity + qty,
        value: current.value + qty * 10, // Dummy value
      });
      totalQuantity += qty;
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      quantity: data.quantity,
      value: data.value,
      percentage: totalQuantity > 0 ? (data.quantity / totalQuantity) * 100 : 0,
    }));
  }

  async getDailyMovements(days = 30): Promise<DailyMovements[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        createdAt: true,
        transactionType: true,
      },
    });

    const dailyMap = new Map<string, DailyMovements>();

    // Initialize map
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap.set(dateStr, {
        date: dateStr,
        receivings: 0,
        picks: 0,
        movements: 0,
      });
    }

    transactions.forEach((t) => {
      const dateStr = t.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(dateStr);
      if (entry) {
        if (t.transactionType === 'RECEIVING') entry.receivings++;
        else if (t.transactionType === 'PICKING') entry.picks++;
        else entry.movements++;
      }
    });

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTopProducts(limit = 10): Promise<TopProducts[]> {
    const topMoves = await this.prisma.inventoryTransaction.groupBy({
      by: ['productId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const productIds = topMoves.map((m) => m.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        inventories: { select: { availableQuantity: true } },
      },
    });

    return topMoves.map((m) => {
      const p = products.find((prod) => prod.id === m.productId);
      return {
        productCode: p?.code || 'N/A',
        productName: p?.name || 'N/A',
        totalMovements: m._count.id,
        currentStock: p?.inventories.reduce((sum, inv) => sum + inv.availableQuantity, 0) || 0,
      };
    });
  }

  async getOrdersByStatus(): Promise<OrdersByStatus[]> {
    const statuses: Array<'pending' | 'picking' | 'picked' | 'shipped'> = [
      'pending',
      'picking',
      'picked',
      'shipped',
    ];

    const counts = await Promise.all(
      statuses.map((s) => this.prisma.salesOrder.count({ where: { status: s } }))
    );

    const total = counts.reduce((a, b) => a + b, 0);

    return statuses.map((status, i) => ({
      status,
      count: counts[i],
      percentage: total > 0 ? (counts[i] / total) * 100 : 0,
    }));
  }

  async getWarehouseOccupancy(): Promise<WarehouseOccupancy> {
    const [locations, inventories] = await Promise.all([
      this.prisma.location.findMany({
        where: { isActive: true },
        select: { capacity: true, id: true },
      }),
      this.prisma.inventory.aggregate({
        _sum: { quantity: true },
      }),
    ]);

    const totalCapacity = locations.reduce((sum, loc) => sum + loc.capacity, 0);
    const currentStock = inventories._sum.quantity || 0;
    const utilizationRate = totalCapacity > 0 ? (currentStock / totalCapacity) * 100 : 0;

    return {
      totalCapacity,
      currentStock,
      utilizationRate,
      availableCapacity: Math.max(0, totalCapacity - currentStock),
    };
  }
}
