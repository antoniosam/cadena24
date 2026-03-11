export interface DashboardKPIs {
  totalProducts: number;
  totalStock: number;
  stockValue: number;
  lowStockAlerts: number;
  pendingOrders: number;
  ordersToday: number;
  ordersFulfilled: number;
  receivingsToday: number;
  picksToday: number;
  movementsToday: number;
  totalLocations: number;
  occupiedLocations: number;
  utilizationRate: number;
}

export interface StockByCategory {
  category: string;
  quantity: number;
  value: number;
  percentage: number;
}

export interface DailyMovements {
  date: string;
  receivings: number;
  picks: number;
  movements: number;
}

export interface TopProducts {
  productCode: string;
  productName: string;
  totalMovements: number;
  currentStock: number;
}

export interface OrdersByStatus {
  status: 'pending' | 'picking' | 'picked' | 'shipped';
  count: number;
  percentage: number;
}

export interface WarehouseOccupancy {
  totalCapacity: number;
  currentStock: number;
  utilizationRate: number;
  availableCapacity: number;
}
