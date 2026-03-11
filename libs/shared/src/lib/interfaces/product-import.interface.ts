export interface IProductImportRow {
  codigoProducto: string;
  cantidadEsperada: number;
  costoUnitario: number;
}

export interface IProductImportValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface IProductImportValidationResult {
  isValid: boolean;
  errors: IProductImportValidationError[];
  validRows: IProductImportRow[];
  totalRows: number;
}

export interface IProductImportProgress {
  current: number;
  total: number;
  successCount: number;
  failedCount: number;
  currentProduct?: string;
}

export interface IProductImportResult {
  success: boolean;
  message: string;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  error?: string;
  failedRow?: number;
}
