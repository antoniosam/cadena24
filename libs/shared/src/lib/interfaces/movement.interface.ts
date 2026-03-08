import { Product } from './product.interface';
import { Location } from './location.interface';
import { IUserSummary } from './user.interface';

export type MovementType = 'PUTAWAY' | 'REPLENISHMENT' | 'CONSOLIDATION' | 'RELOCATION';
export type MovementStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type MovementLineStatus = 'pending' | 'completed';

export interface MovementOrder {
  id: number;
  orderNumber: string;
  warehouseId: number;
  movementType: MovementType;
  reason?: string;
  status: MovementStatus;
  notes?: string;
  createdBy?: number;
  executedBy?: number;
  createdAt: Date;
  completedAt?: Date;

  lines?: MovementOrderLine[];
  warehouse?: { id: number; code: string; name: string };
  createdUser?: IUserSummary;
  executedUser?: IUserSummary;
}

export interface MovementOrderLine {
  id: number;
  movementOrderId: number;
  productId: number;
  fromLocationId: number;
  toLocationId: number;
  quantity: number;
  movedQuantity: number;
  status: MovementLineStatus;
  executedAt?: Date;

  product?: Product;
  fromLocation?: Location;
  toLocation?: Location;
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateMovementLineDto {
  productId: number;
  fromLocationId: number;
  toLocationId: number;
  quantity: number;
}

export interface CreateMovementOrderDto {
  warehouseId: number;
  movementType: MovementType;
  reason?: string;
  notes?: string;
  lines: CreateMovementLineDto[];
}

export interface ExecuteMovementLineDto {
  lineId: number;
  movedQuantity: number;
}

export interface ValidateMovementDto {
  productId: number;
  fromLocationId: number;
  toLocationId: number;
  quantity: number;
}

export interface SuggestLocationDto {
  productId: number;
  quantity: number;
  preferredType?: string;
}

export interface QueryMovementOrderDto {
  warehouseId?: number;
  movementType?: MovementType;
  status?: MovementStatus;
  page?: number;
  limit?: number;
}

export interface MovementOrdersResponse {
  items: MovementOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
