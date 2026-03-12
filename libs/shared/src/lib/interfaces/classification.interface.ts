export interface Classification {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClassificationDto {
  code: string;
  name: string;
  isActive?: boolean;
}

export interface UpdateClassificationDto {
  code?: string;
  name?: string;
  isActive?: boolean;
}

export interface ClassificationsResponse {
  items: Classification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClassificationQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
