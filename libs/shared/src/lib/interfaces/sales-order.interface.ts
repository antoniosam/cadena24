import { Product } from './product.interface';
import { IUserSummary } from './user.interface';
import { Client } from './client.interface';

export type SalesOrderStatus = 'pending' | 'picking' | 'picked' | 'shipped' | 'cancelled';
export type SalesOrderPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SalesOrderLineStatus = 'pending' | 'picking' | 'picked' | 'shipped' | 'cancelled';

export interface SalesOrder {
  id: number;
  orderNumber: string;
  warehouseId: number;
  clientId: number;

  orderDate: Date;
  requiredDate?: Date;
  shippedDate?: Date;

  priority: SalesOrderPriority;
  status: SalesOrderStatus;
  totalAmount: number;
  notes?: string;

  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  lines?: SalesOrderLine[];
  warehouse?: {
    id: number;
    code: string;
    name: string;
  };
  client?: Client;
  createdUser?: IUserSummary;
}

export interface SalesOrderLine {
  id: number;
  salesOrderId: number;
  productId: number;
  orderedQuantity: number;
  pickedQuantity: number;
  shippedQuantity: number;
  unitPrice: number;
  subtotal: number;
  status: SalesOrderLineStatus;
  notes?: string;

  // Relations
  product?: Product;
  salesOrder?: SalesOrder;
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateSalesOrderLineDto {
  productId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface CreateSalesOrderDto {
  clientId: number;
  requiredDate?: Date;
  priority?: SalesOrderPriority;
  notes?: string;
  lines: CreateSalesOrderLineDto[];
}

export interface UpdateSalesOrderDto {
  clientId?: number;
  requiredDate?: Date;
  notes?: string;
}

export interface UpdateSalesOrderPriorityDto {
  priority: SalesOrderPriority;
}

export interface QuerySalesOrdersDto {
  status?: SalesOrderStatus;
  priority?: SalesOrderPriority;
  customerName?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface ValidateStockItemDto {
  productId: number;
  quantity: number;
}

export interface ValidateStockDto {
  items: ValidateStockItemDto[];
}

export interface StockValidationItem {
  productId: number;
  requested: number;
  available: number;
  canFulfill: boolean;
  message?: string;
}

export interface StockValidationResult {
  valid: boolean;
  items: StockValidationItem[];
}

export interface SalesOrdersResponse {
  items: SalesOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
