export interface Client {
  id: number;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientDto {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive: boolean;
}

export interface UpdateClientDto {
  code?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive?: boolean;
}

export interface QueryClientsDto {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ClientsResponse {
  items: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
