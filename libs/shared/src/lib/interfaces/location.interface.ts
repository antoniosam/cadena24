export interface Location {
  id: number;
  warehouseId: number;
  zone: string;
  row: string;
  position: string;
  level: string;
  barcode: string;
  fullPath: string;
  name: string;
  type: 'receiving' | 'storage' | 'picking' | 'shipping';
  sequence: number;
  height: number;
  capacity: number;
  maxWeight: number;
  allowMixedProducts: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  warehouse?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface CreateLocationDto {
  warehouseId: number;
  zone: string;
  row: string;
  position: string;
  level: string;
  barcode: string;
  name: string;
  type: 'receiving' | 'storage' | 'picking' | 'shipping';
  sequence?: number;
  height?: number;
  capacity: number;
  maxWeight?: number;
  allowMixedProducts?: boolean;
  isActive?: boolean;
}

export interface UpdateLocationDto {
  zone?: string;
  row?: string;
  position?: string;
  level?: string;
  barcode?: string;
  name?: string;
  type?: 'receiving' | 'storage' | 'picking' | 'shipping';
  sequence?: number;
  height?: number;
  capacity?: number;
  maxWeight?: number;
  allowMixedProducts?: boolean;
  isActive?: boolean;
}

export interface QueryLocationDto {
  warehouseId?: number;
  zone?: string;
  type?: 'receiving' | 'storage' | 'picking' | 'shipping';
  isActive?: boolean;
  search?: string;
  barcode?: string;
  availableOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface LocationTreeNode {
  zone: string;
  rows: {
    row: string;
    positions: {
      position: string;
      levels: Location[];
    }[];
  }[];
}
