export interface Provider {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProviderDto {
  code: string;
  name: string;
  isActive?: boolean;
}

export interface UpdateProviderDto {
  code?: string;
  name?: string;
  isActive?: boolean;
}

export interface ProvidersResponse {
  items: Provider[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProviderQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
