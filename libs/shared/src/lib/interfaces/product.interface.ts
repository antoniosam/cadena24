export interface ProductBarcode {
  id: number;
  productId: number;
  barcode: string;
  type: 'EAN13' | 'CODE128' | 'QR' | 'CUSTOM';
  isPrimary: boolean;
  createdAt: Date;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description?: string;
  category?: string;
  uom: string;

  // Niveles de inventario
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;

  // Atributos físicos
  weight: number;
  width: number;
  height: number;
  depth: number;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;

  // Relaciones
  barcodes?: ProductBarcode[];
  inventories?: any[];
  classificationId?: number;
  classification?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface CreateProductDto {
  code: string;
  name: string;
  description?: string;
  category?: string;
  uom: string;
  barcode: string; // Single barcode (CODE128) - required, auto-generated if not provided
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
  isActive?: boolean;
  classificationId: number;
}

export interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
