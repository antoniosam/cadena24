import { Component, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductImportService } from '../../services/product-import.service';
import { ProductsApiService } from '../../../products/services/products-api.service';
import {
  IProductImportRow,
  IProductImportValidationResult,
  IProductImportProgress,
  IProductImportResult,
  CreateReceivingOrderLineDto,
} from '@cadena24-wms/shared';

@Component({
  selector: 'app-product-bulk-import-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-bulk-import-modal.component.html',
  styleUrl: './product-bulk-import-modal.component.scss',
})
export class ProductBulkImportModalComponent {
  private importService = inject(ProductImportService);
  private productsApi = inject(ProductsApiService);

  // Outputs
  productsImported = output<CreateReceivingOrderLineDto[]>();
  closed = output<void>();
  importFinished = output<void>();

  // State
  step = signal<'upload' | 'preview' | 'processing' | 'result'>('upload');
  selectedFile = signal<File | null>(null);
  parsedRows = signal<IProductImportRow[]>([]);
  validationResult = signal<IProductImportValidationResult | null>(null);
  isProcessing = signal<boolean>(false);
  progress = signal<IProductImportProgress | null>(null);
  result = signal<IProductImportResult | null>(null);
  error = signal<string | null>(null);
  isDragOver = signal<boolean>(false);

  close(): void {
    if (this.isProcessing()) {
      if (!confirm('¿Está seguro de cancelar el proceso de importación?')) {
        return;
      }
    }
    this.reset();
    this.closed.emit();
  }

  reset(): void {
    this.step.set('upload');
    this.selectedFile.set(null);
    this.parsedRows.set([]);
    this.validationResult.set(null);
    this.isProcessing.set(false);
    this.progress.set(null);
    this.result.set(null);
    this.error.set(null);
  }

  downloadTemplate(): void {
    this.importService.generateTemplate();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isProcessing()) {
      this.isDragOver.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (this.isProcessing()) return;

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.error.set('Por favor seleccione un archivo Excel (.xlsx o .xls)');
      return;
    }

    this.selectedFile.set(file);
    this.error.set(null);
    this.parseFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        this.error.set('Por favor seleccione un archivo Excel (.xlsx o .xls)');
        return;
      }

      this.selectedFile.set(file);
      this.error.set(null);
      this.parseFile(file);
    }
  }

  parseFile(file: File): void {
    this.isProcessing.set(true);
    this.error.set(null);

    this.importService.parseExcelFile(file).subscribe({
      next: (rows) => {
        if (rows.length === 0) {
          this.error.set('El archivo no contiene datos válidos');
          this.isProcessing.set(false);
          return;
        }

        this.parsedRows.set(rows);
        this.validateRows(rows);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al procesar el archivo');
        this.isProcessing.set(false);
      },
    });
  }

  filterEmptyFirstRow(rows: IProductImportRow[]): IProductImportRow[] {
    if (rows.length > 0 && !rows[0].codigoProducto) {
      return rows.slice(1);
    }
    return rows;
  }

  validateRows(rows: IProductImportRow[]): void {
    const filteredRows = this.filterEmptyFirstRow(rows);
    if (filteredRows.length === 0) {
      this.error.set('No se encontraron productos válidos para importar');
      this.isProcessing.set(false);
      return;
    }
    this.importService.validateRows(filteredRows).subscribe({
      next: (validationResult) => {
        this.validationResult.set(validationResult);
        this.isProcessing.set(false);

        if (validationResult.isValid) {
          this.step.set('preview');
        } else {
          this.step.set('upload');
        }
      },
      error: (err) => {
        this.error.set(err.message || 'Error al validar los datos');
        this.isProcessing.set(false);
      },
    });
  }

  async processImport(): Promise<void> {
    const validation = this.validationResult();
    if (!validation || !validation.isValid) {
      return;
    }

    this.step.set('processing');
    this.isProcessing.set(true);
    this.error.set(null);

    const rows = validation.validRows;
    const total = rows.length;
    let successCount = 0;
    let failedCount = 0;

    // Get all products to map codes to IDs
    try {
      const productsResponse = await this.productsApi
        .getProducts({ isActive: true, limit: 10000 })
        .toPromise();
      const productMap = new Map(productsResponse!.items.map((p) => [p.code, p.id]));

      const importedLines: CreateReceivingOrderLineDto[] = [];

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // Update progress
        this.progress.set({
          current: i + 1,
          total,
          successCount,
          failedCount,
          currentProduct: row.codigoProducto,
        });

        // Get product ID from code
        const productId = productMap.get(row.codigoProducto);

        if (!productId) {
          // This should not happen as we validated before, but handle it anyway
          this.result.set({
            success: false,
            message: `Error en fila ${i + 2}`,
            totalProcessed: i,
            successCount,
            failedCount: failedCount + 1,
            error: `Producto "${row.codigoProducto}" no encontrado`,
            failedRow: i + 2,
          });
          this.step.set('result');
          this.isProcessing.set(false);
          return;
        }

        // Create line DTO
        const lineDto: CreateReceivingOrderLineDto = {
          productId,
          expectedQuantity: row.cantidadEsperada,
          unitCost: row.costoUnitario,
        };

        importedLines.push(lineDto);
        successCount++;

        // Small delay to show progress
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Success - emit all imported lines
      this.result.set({
        success: true,
        message: 'Importación completada exitosamente',
        totalProcessed: total,
        successCount,
        failedCount: 0,
      });

      this.productsImported.emit(importedLines);
      this.step.set('result');
      this.isProcessing.set(false);
    } catch (error: any) {
      this.result.set({
        success: false,
        message: 'Error al procesar productos',
        totalProcessed: 0,
        successCount,
        failedCount: failedCount + 1,
        error: error.message || 'Error desconocido',
      });
      this.step.set('result');
      this.isProcessing.set(false);
    }
  }

  backToUpload(): void {
    this.step.set('upload');
    this.selectedFile.set(null);
    this.parsedRows.set([]);
    this.validationResult.set(null);
    this.error.set(null);
  }

  finishImport(): void {
    this.importFinished.emit();
    this.close();
  }
}
