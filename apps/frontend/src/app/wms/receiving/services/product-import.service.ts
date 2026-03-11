import { Injectable, inject } from '@angular/core';
import * as XLSX from 'xlsx';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import {
  IProductImportRow,
  IProductImportValidationResult,
  IProductImportValidationError,
} from '@cadena24-wms/shared';
import { ProductsApiService } from '../../products/services/products-api.service';

@Injectable({
  providedIn: 'root',
})
export class ProductImportService {
  private productsApi = inject(ProductsApiService);

  /**
   * Parse Excel file and extract rows
   */
  parseExcelFile(file: File): Observable<IProductImportRow[]> {
    return from(
      new Promise<IProductImportRow[]>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e: any) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Get first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to JSON
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: '',
            });

            // Skip header row and parse data
            const rows: IProductImportRow[] = [];

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];

              // Skip empty rows
              if (!row || row.length === 0 || !row[0]) {
                continue;
              }

              rows.push({
                codigoProducto: String(row[0] || '').trim(),
                cantidadEsperada: Number(row[1]) || 0,
                costoUnitario: Number(row[2]) || 0,
              });
            }

            resolve(rows);
          } catch (error) {
            reject(new Error('Error al parsear archivo Excel: ' + (error as Error).message));
          }
        };

        reader.onerror = () => {
          reject(new Error('Error al leer el archivo'));
        };

        reader.readAsArrayBuffer(file);
      })
    );
  }

  /**
   * Validate imported rows
   */
  validateRows(rows: IProductImportRow[]): Observable<IProductImportValidationResult> {
    const errors: IProductImportValidationError[] = [];
    const validRows: IProductImportRow[] = [];

    // Basic validation
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because Excel rows start at 1 and we skip header

      // Validate Código Producto
      if (!row.codigoProducto || row.codigoProducto.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'codigoProducto',
          value: row.codigoProducto,
          message: 'Código de producto es requerido',
        });
      }

      // Validate Cantidad Esperada
      if (
        row.cantidadEsperada === null ||
        row.cantidadEsperada === undefined ||
        isNaN(row.cantidadEsperada) ||
        row.cantidadEsperada <= 0
      ) {
        errors.push({
          row: rowNumber,
          field: 'cantidadEsperada',
          value: row.cantidadEsperada,
          message: 'Cantidad esperada debe ser mayor a 0',
        });
      }

      // Validate Costo Unitario
      if (
        row.costoUnitario === null ||
        row.costoUnitario === undefined ||
        isNaN(row.costoUnitario) ||
        row.costoUnitario < 0
      ) {
        errors.push({
          row: rowNumber,
          field: 'costoUnitario',
          value: row.costoUnitario,
          message: 'Costo unitario debe ser mayor o igual a 0',
        });
      }

      // If no errors for this row, add to valid rows
      if (!errors.some((e) => e.row === rowNumber)) {
        validRows.push(row);
      }
    });

    // If there are basic validation errors, return immediately
    if (errors.length > 0) {
      return of({
        isValid: false,
        errors,
        validRows: [],
        totalRows: rows.length,
      });
    }

    // Validate product codes against database
    return this.validateProductCodes(validRows).pipe(
      map((productErrors) => {
        const allErrors = [...errors, ...productErrors];
        const isValid = allErrors.length === 0;

        return {
          isValid,
          errors: allErrors,
          validRows: isValid ? validRows : [],
          totalRows: rows.length,
        };
      })
    );
  }

  /**
   * Validate product codes exist in database
   */
  private validateProductCodes(
    rows: IProductImportRow[]
  ): Observable<IProductImportValidationError[]> {
    const productCodes = [...new Set(rows.map((r) => r.codigoProducto))];
    const errors: IProductImportValidationError[] = [];

    // Get all products
    return this.productsApi.getProducts({ isActive: true, limit: 10000 }).pipe(
      map((response) => {
        const existingCodes = new Set(response.items.map((p) => p.code));

        rows.forEach((row, index) => {
          const rowNumber = index + 2;

          if (!existingCodes.has(row.codigoProducto)) {
            errors.push({
              row: rowNumber,
              field: 'codigoProducto',
              value: row.codigoProducto,
              message: `Producto con código "${row.codigoProducto}" no existe en la base de datos`,
            });
          }
        });

        return errors;
      }),
      catchError((error) => {
        // If API call fails, return error
        return of([
          {
            row: 0,
            field: 'api',
            value: null,
            message: 'Error al validar productos: ' + (error.error?.message || error.message),
          },
        ]);
      })
    );
  }

  /**
   * Generate Excel template
   */
  generateTemplate(): void {
    const data = [
      ['Código Producto', 'Cantidad Esperada', 'Costo Unitario'],
      ['PROD-001', 10, 25.5],
      ['PROD-002', 5, 100.0],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    // Set column widths
    worksheet['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }];

    XLSX.writeFile(workbook, 'plantilla-productos-recepcion.xlsx');
  }
}
