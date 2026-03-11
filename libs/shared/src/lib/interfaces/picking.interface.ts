import { Product } from './product.interface';
import { IUserSummary } from './user.interface';

export type PickListStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type PickListLineStatus = 'pending' | 'picking' | 'picked' | 'short';

// ── Entities ──────────────────────────────────────────────────────────────────

export interface PickList {
  id: number;
  pickListNumber: string;
  salesOrderId: number;
  warehouseId: number;
  pickerId?: number;
  status: PickListStatus;
  totalLines: number;
  pickedLines: number;
  notes?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Relations
  salesOrder?: {
    id: number;
    orderNumber: string;
    customerName: string;
    status: string;
  };
  warehouse?: {
    id: number;
    code: string;
    name: string;
  };
  picker?: IUserSummary;
  lines?: PickListLine[];
}

export interface PickListLine {
  id: number;
  pickListId: number;
  salesOrderLineId: number;
  productId: number;
  locationId: number;
  quantityToPick: number;
  quantityPicked: number;
  sequence: number;
  status: PickListLineStatus;
  notes?: string;
  pickedAt?: Date;

  // Relations
  product?: Product;
  location?: {
    id: number;
    name: string;
    fullPath: string;
    barcode: string;
    zone: string;
    row: string;
    position: string;
    level: string;
  };
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface GeneratePickListDto {
  salesOrderId: number;
  notes?: string;
}

export interface AssignPickerDto {
  pickerId: number;
}

export interface PickLineDto {
  lineId: number;
  quantityPicked: number;
  notes?: string;
}

export interface QueryPickListsDto {
  status?: PickListStatus;
  salesOrderId?: number;
  pickerId?: number;
  warehouseId?: number;
  page?: number;
  limit?: number;
}

// ── Responses ─────────────────────────────────────────────────────────────────

export interface PickListsResponse {
  items: PickList[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OptimizedRouteResponse {
  pickListId: number;
  totalLines: number;
  lines: PickListLine[];
}
