import { Product } from './product.interface';

export interface InventoryLocation {
  name: string;
  fullPath: string;
  barcode: string;
}

export interface Inventory {
  id: string;
  productId: string;
  locationId: string;
  warehouseId: string;

  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;

  status: 'available' | 'reserved' | 'damaged' | 'quarantine';

  lastCountDate?: Date;
  updatedAt: Date;

  product?: Product;
  location?: InventoryLocation;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  warehouseId: string;
  fromLocationId?: string;
  toLocationId?: string;

  quantity: number;
  transactionType: 'RECEIVE' | 'MOVE' | 'PICK' | 'ADJUST' | 'DAMAGE';

  referenceType: string;
  referenceId?: string;

  notes?: string;
  userId?: string;

  createdAt: Date;

  product?: Product;
  fromLocation?: { name: string; fullPath: string };
  toLocation?: { name: string; fullPath: string };
  user?: { name: string; email: string };
}

export interface InventoryAdjustmentLine {
  id: string;
  adjustmentId: string;
  productId: string;
  locationId: string;

  systemQuantity: number;
  physicalQuantity: number;
  difference: number;

  createdAt: Date;

  product?: Product;
  location?: InventoryLocation;
}

export interface InventoryAdjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  reason: 'PHYSICAL_COUNT' | 'DAMAGE' | 'FOUND' | 'LOST' | 'CORRECTION';
  status: 'draft' | 'approved' | 'cancelled';

  notes?: string;

  approvedBy?: string;
  createdBy?: string;

  createdAt: Date;
  approvedAt?: Date;

  lines: InventoryAdjustmentLine[];
  creator?: { name: string; email: string };
  approver?: { name: string; email: string };
}

export interface CreateAdjustmentLineDto {
  productId: string;
  locationId: string;
  systemQuantity: number;
  physicalQuantity: number;
}

export interface CreateAdjustmentDto {
  warehouseId: string;
  reason: 'PHYSICAL_COUNT' | 'DAMAGE' | 'FOUND' | 'LOST' | 'CORRECTION';
  notes?: string;
  lines: CreateAdjustmentLineDto[];
}

export interface ReserveInventoryDto {
  productId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
}

export interface ReleaseReservationDto {
  productId: string;
  quantity: number;
  referenceId: string;
}
