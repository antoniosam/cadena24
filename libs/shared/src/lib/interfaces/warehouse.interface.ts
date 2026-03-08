export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWarehouseDto {
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface UpdateWarehouseDto {
  code?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface QueryWarehouseDto {
  search?: string;
  isActive?: boolean;
  isPrimary?: boolean;
  page?: number;
  limit?: number;
}
