import { Component, EventEmitter, Output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { ProductsApiService } from '../../../services/products-api.service';
import { CreateProductDto } from '@cadena24-wms/shared';

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_UOMS = ['UND', 'KG', 'LT', 'MT', 'CJ', 'BL', 'PAR'] as const;
const MAX_ROWS = 500;
const REQUIRED_COLUMNS = ['code', 'name', 'barcode', 'uom'] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExcelRow {
  code: string;
  name: string;
  barcode: string;
  uom: string;
  category?: string;
  description?: string;
  minStock?: number;
}

interface BulkRow {
  rowNumber: number;
  raw: ExcelRow;
  errors: string[];
  status: 'pending' | 'sending' | 'success' | 'error';
  serverError?: string;
}

type UploadStep = 'idle' | 'preview' | 'importing' | 'done';

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-product-bulk-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-bulk-upload.component.html',
  styleUrl: './product-bulk-upload.component.scss',
})
export class ProductBulkUploadComponent {
  @Output() closed = new EventEmitter<boolean>();

  private api = inject(ProductsApiService);

  // ── State ──────────────────────────────────────────────────────────────────

  step = signal<UploadStep>('idle');
  rows = signal<BulkRow[]>([]);
  currentIndex = signal<number>(0);
  dragOver = signal<boolean>(false);
  fileName = signal<string>('');

  // ── Computed ───────────────────────────────────────────────────────────────

  validRows = computed(() => this.rows().filter((r) => r.errors.length === 0));
  invalidRows = computed(() => this.rows().filter((r) => r.errors.length > 0));
  successRows = computed(() => this.rows().filter((r) => r.status === 'success'));
  failedRows = computed(() => this.rows().filter((r) => r.status === 'error'));
  progress = computed(() => {
    const total = this.validRows().length;
    if (total === 0) return 0;
    return Math.round((this.currentIndex() / total) * 100);
  });
  canImport = computed(() => this.validRows().length > 0 && this.step() === 'preview');
  isImporting = computed(() => this.step() === 'importing');
  isDone = computed(() => this.step() === 'done');

  // ── File handling ──────────────────────────────────────────────────────────

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(): void {
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File): void {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Solo se permiten archivos Excel (.xlsx, .xls)');
      return;
    }

    this.fileName.set(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
        raw: false,
      });
      this.parseRows(rawRows);
    };
    reader.readAsArrayBuffer(file);
  }

  // ── Parsing & Validation ───────────────────────────────────────────────────

  private parseRows(rawRows: Record<string, unknown>[]): void {
    if (rawRows.length === 0) {
      alert('El archivo no contiene datos.');
      return;
    }

    const limited = rawRows.slice(0, MAX_ROWS);
    const parsed: BulkRow[] = limited.map((raw, index) => {
      const row = this.normalizeRow(raw);
      return {
        rowNumber: index + 2, // Excel row (header = 1)
        raw: row,
        errors: this.validateRow(row),
        status: 'pending',
      };
    });

    this.rows.set(parsed);
    this.step.set('preview');
  }

  private normalizeRow(raw: Record<string, unknown>): ExcelRow {
    const str = (v: unknown): string => String(v ?? '').trim();
    const num = (v: unknown): number => {
      const n = parseFloat(String(v ?? '0').replace(',', '.'));
      return isNaN(n) ? 0 : Math.max(0, n);
    };

    return {
      code: str(raw['code'] ?? raw['Código'] ?? raw['Codigo'] ?? raw['CODE']),
      name: str(raw['name'] ?? raw['Nombre'] ?? raw['NAME']),
      barcode: str(raw['barcode'] ?? raw['Código de Barras'] ?? raw['Barcode'] ?? raw['BARCODE']),
      uom: str(raw['uom'] ?? raw['Unidad'] ?? raw['UOM']).toUpperCase(),
      category: str(raw['category'] ?? raw['Categoría'] ?? raw['Categoria'] ?? raw['CATEGORY']),
      description: str(
        raw['description'] ?? raw['Descripción'] ?? raw['Descripcion'] ?? raw['DESCRIPTION']
      ),
      minStock: num(
        raw['minStock'] ?? raw['Stock Mínimo'] ?? raw['Stock Minimo'] ?? raw['MINSTOCK']
      ),
    };
  }

  private validateRow(row: ExcelRow): string[] {
    const errors: string[] = [];

    // Required fields
    if (!row.code) errors.push('Código es requerido');
    else if (row.code.length > 50) errors.push('Código excede 50 caracteres');

    if (!row.name) errors.push('Nombre es requerido');
    else if (row.name.length > 255) errors.push('Nombre excede 255 caracteres');

    if (!row.barcode) errors.push('Código de barras es requerido');
    else {
      if (row.barcode.length > 48) errors.push('Código de barras excede 48 caracteres');
      if (!/^[\x00-\x7F]+$/.test(row.barcode))
        errors.push('Código de barras contiene caracteres inválidos (solo ASCII)');
    }

    if (!row.uom) errors.push('Unidad de medida es requerida');
    else if (!(VALID_UOMS as readonly string[]).includes(row.uom))
      errors.push(`UOM inválida. Valores permitidos: ${VALID_UOMS.join(', ')}`);

    // Optional numeric
    if (row.minStock !== undefined && row.minStock < 0)
      errors.push('Stock mínimo no puede ser negativo');

    return errors;
  }

  // ── Import ─────────────────────────────────────────────────────────────────

  async startImport(): Promise<void> {
    if (!this.canImport()) return;

    this.step.set('importing');
    this.currentIndex.set(0);

    const valid = this.validRows();

    for (let i = 0; i < valid.length; i++) {
      const bulkRow = valid[i];

      // Mark as sending
      this.updateRowStatus(bulkRow.rowNumber, 'sending');
      this.currentIndex.set(i);

      const dto = this.buildDto(bulkRow.raw);
      dto.maxStock = 100000;
      dto.reorderPoint = dto.minStock;
      dto.reorderQuantity = dto.minStock;

      const success = await this.sendRow(bulkRow.rowNumber, dto);
      if (!success) {
        // Stop on first error (per user requirements)
        this.currentIndex.set(i + 1);
        this.step.set('done');
        return;
      }
    }

    this.currentIndex.set(valid.length);
    this.step.set('done');
  }

  private buildDto(row: ExcelRow): CreateProductDto {
    return {
      code: row.code,
      name: row.name,
      barcode: row.barcode,
      uom: row.uom,
      category: row.category ?? '',
      description: row.description ?? '',
      minStock: row.minStock ?? 0,
      // Defaults added here after validation
      maxStock: 0,
      reorderPoint: 0,
      reorderQuantity: 0,
      weight: 0,
      width: 0,
      height: 0,
      depth: 0,
      isActive: true,
    };
  }

  private sendRow(rowNumber: number, dto: CreateProductDto): Promise<boolean> {
    return new Promise((resolve) => {
      this.api.createProduct(dto).subscribe({
        next: () => {
          this.updateRowStatus(rowNumber, 'success');
          resolve(true);
        },
        error: (err) => {
          const message =
            err?.error?.message ??
            (Array.isArray(err?.error?.message) ? err.error.message.join(', ') : null) ??
            'Error del servidor';
          this.updateRowStatus(rowNumber, 'error', message);
          resolve(false);
        },
      });
    });
  }

  private updateRowStatus(
    rowNumber: number,
    status: BulkRow['status'],
    serverError?: string
  ): void {
    this.rows.update((rows) =>
      rows.map((r) => (r.rowNumber === rowNumber ? { ...r, status, serverError } : r))
    );
  }

  // ── UI Actions ─────────────────────────────────────────────────────────────

  reset(): void {
    this.step.set('idle');
    this.rows.set([]);
    this.currentIndex.set(0);
    this.fileName.set('');
  }

  close(): void {
    const hadSuccess = this.successRows().length > 0;
    this.closed.emit(hadSuccess);
  }
}
