import { Product } from './product.interface';
import { Location } from './location.interface';
import { IUserSummary } from './user.interface';

export interface ReceivingOrder {
  id: number;
  orderNumber: string;
  warehouseId: number;
  supplierName: string;
  supplierCode?: string;
  purchaseOrderNumber?: string;
  expectedDate?: Date;
  receivedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdBy?: number;
  receivedBy?: number;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  lines?: ReceivingOrderLine[];
  warehouse?: {
    id: number;
    code: string;
    name: string;
  };
  createdUser?: IUserSummary;
  receivedUser?: IUserSummary;
}

export interface ReceivingOrderLine {
  id: number;
  receivingOrderId: number;
  productId: number;
  locationId?: number;
  expectedQuantity: number;
  receivedQuantity: number;
  damageQuantity: number;
  unitCost?: number;
  status: 'pending' | 'received' | 'partial';
  notes?: string;
  receivedAt?: Date;

  // Relations
  product?: Product;
  location?: Location;
  receivingOrder?: ReceivingOrder;
}

export interface CreateReceivingOrderLineDto {
  productId: number;
  expectedQuantity: number;
  unitCost?: number;
}

export interface CreateReceivingOrderDto {
  warehouseId: number;
  supplierName: string;
  supplierCode?: string;
  purchaseOrderNumber?: string;
  expectedDate?: Date;
  notes?: string;
  lines: CreateReceivingOrderLineDto[];
}

export interface ReceiveLineDto {
  receivingOrderId: number;
  lineId: number;
  receivedQuantity: number;
  damageQuantity?: number;
  locationId: number;
  notes?: string;
}

export interface QueryReceivingOrderDto {
  warehouseId?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface ReceivingOrdersResponse {
  items: ReceivingOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DamagedItem {
  id: number;
  receivingOrderNumber: string;
  productCode: string;
  productName: string;
  damageQuantity: number;
  receivedDate?: Date;
  locationName?: string;
  notes?: string;
}
