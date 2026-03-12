import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReceivingApiService } from '../../services/receiving-api.service';
import { ProductsApiService } from '../../../products/services/products-api.service';
import { ProvidersApiService } from '../../../providers/services/providers-api.service';
import { WarehousesApiService } from '../../../warehouses/services/warehouses-api.service';
import { Product, Warehouse, Provider, CreateReceivingOrderLineDto } from '@cadena24-wms/shared';
import { ProductBulkImportModalComponent } from '../../components/product-bulk-import-modal/product-bulk-import-modal.component';

@Component({
  selector: 'app-receiving-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProductBulkImportModalComponent],
  templateUrl: './receiving-create.component.html',
  styleUrl: './receiving-create.component.scss',
})
export class ReceivingCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private receivingApi = inject(ReceivingApiService);
  private productsApi = inject(ProductsApiService);
  private providersApi = inject(ProvidersApiService);
  private warehousesApi = inject(WarehousesApiService);
  private cdr = inject(ChangeDetectorRef);

  // Signal for bulk import modal visibility
  showBulkImportModal = signal<boolean>(false);

  form: FormGroup;
  warehouses = signal<Warehouse[]>([]);
  providers = signal<Provider[]>([]);
  products = signal<Product[]>([]);
  loadingWarehouses = signal<boolean>(false);
  loadingProducts = signal<boolean>(false);
  loadingProviders = signal<boolean>(false);
  submitting = signal<boolean>(false);
  generatingOC = signal<boolean>(false);
  error = signal<string | null>(null);

  // Product search
  productSearch = signal<string>('');
  filteredProducts = signal<Product[]>([]);

  constructor() {
    this.form = this.fb.group({
      warehouseId: [null, [Validators.required]],
      providerId: [null, [Validators.required]],
      purchaseOrderNumber: ['', [Validators.maxLength(50)]],
      expectedDate: [''],
      notes: [''],
      lines: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadWarehouses();
    this.loadProducts();
    this.loadProviders();
    this.addLine(); // Add first line by default
  }

  loadWarehouses(): void {
    this.loadingWarehouses.set(true);
    this.warehousesApi.getAll({ isActive: true }).subscribe({
      next: (response) => {
        this.warehouses.set(response.items);
        this.loadingWarehouses.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar almacenes: ' + (err.error?.message || err.message));
        this.loadingWarehouses.set(false);
      },
    });
  }

  loadProducts(): void {
    this.loadingProducts.set(true);
    this.productsApi.getProducts({ isActive: true, limit: 1000 }).subscribe({
      next: (response) => {
        this.products.set(response.items);
        this.filteredProducts.set(response.items);
        this.loadingProducts.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar productos: ' + (err.error?.message || err.message));
        this.loadingProducts.set(false);
      },
    });
  }

  loadProviders(): void {
    this.loadingProviders.set(true);
    this.providersApi.getProviders({ isActive: true }).subscribe({
      next: (response) => {
        this.providers.set(response.items);
        this.loadingProviders.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar proveedores: ' + (err.error?.message || err.message));
        this.loadingProviders.set(false);
      },
    });
  }

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  createLineFormGroup(): FormGroup {
    return this.fb.group({
      productId: [null, [Validators.required]],
      expectedQuantity: [0, [Validators.required, Validators.min(0.01)]],
      unitCost: [0, [Validators.min(0)]],
    });
  }

  addLine(): void {
    this.lines.push(this.createLineFormGroup());
  }

  removeLine(index: number): void {
    if (this.lines.length > 1) {
      this.lines.removeAt(index);
      this.cdr.detectChanges();
    }
  }

  getProductName(productId: number): string {
    const product = this.products().find((p) => p.id === productId);
    return product ? `${product.code} - ${product.name}` : '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor complete todos los campos requeridos');
      return;
    }

    if (this.lines.length === 0) {
      this.error.set('Debe agregar al menos una línea de producto');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const formValue = this.form.value;

    const selectedProviderId = Number(formValue.providerId);
    const selectedProvider = this.providers().find((p) => p.id === selectedProviderId);

    // Remove providerId as it's not expected by the backend
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { providerId, ...restFormValue } = formValue;

    // Convert expectedDate to Date if provided
    const dto: any = {
      ...restFormValue,
      warehouseId: Number(formValue.warehouseId),
      supplierName: selectedProvider?.name || 'Unknown',
      supplierCode: selectedProvider?.code,
      expectedDate: formValue.expectedDate ? new Date(formValue.expectedDate) : undefined,
      lines: formValue.lines.map((line: any) => ({
        productId: Number(line.productId),
        expectedQuantity: Number(line.expectedQuantity),
        unitCost: line.unitCost ? Number(line.unitCost) : undefined,
      })),
    };

    this.receivingApi.createReceivingOrder(dto).subscribe({
      next: (order) => {
        alert(`Orden de recepción ${order.orderNumber} creada exitosamente`);
        this.router.navigate(['/wms/receiving']);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al crear orden de recepción');
        this.submitting.set(false);
      },
    });
  }

  onCancel(): void {
    if (confirm('¿Está seguro de cancelar? Los datos no guardados se perderán.')) {
      this.router.navigate(['/wms/receiving']);
    }
  }

  generatePurchaseOrderNumber(): void {
    this.generatingOC.set(true);
    this.receivingApi.getNewPurchaseOrderNumber().subscribe({
      next: (response) => {
        this.form.patchValue({ purchaseOrderNumber: response.suggest });
        this.generatingOC.set(false);
      },
      error: (err) => {
        this.error.set('Error al generar OC: ' + (err.error?.message || err.message));
        this.generatingOC.set(false);
      },
    });
  }

  fieldError(name: string): string | null {
    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.hasError('required')) return 'Campo requerido';
    if (ctrl.hasError('min')) return 'Debe ser mayor a 0';
    if (ctrl.hasError('maxlength')) return 'Longitud máxima excedida';
    return 'Valor inválido';
  }

  lineFieldError(lineIndex: number, fieldName: string): string | null {
    const ctrl = this.lines.at(lineIndex).get(fieldName);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.hasError('required')) return 'Requerido';
    if (ctrl.hasError('min')) return 'Mayor a 0';
    return 'Inválido';
  }

  openBulkImportModal(): void {
    this.showBulkImportModal.set(true);
  }

  onBulkImportClosed(): void {
    this.showBulkImportModal.set(false);
  }

  onImportFinished(): void {
    this.cdr.detectChanges();
  }

  onProductsImported(importedLines: CreateReceivingOrderLineDto[]): void {
    // Clear existing lines
    this.lines.clear();
    this.cdr.detectChanges();
    // Add imported lines to form
    importedLines.forEach((line) => {
      const lineGroup = this.createLineFormGroup();
      lineGroup.patchValue({
        productId: line.productId,
        expectedQuantity: line.expectedQuantity,
        unitCost: line.unitCost || 0,
      });
      this.lines.push(lineGroup);
    });

    // Success message
    this.error.set(null);
    alert(`${importedLines.length} productos importados exitosamente`);
    this.cdr.detectChanges();
  }
}
