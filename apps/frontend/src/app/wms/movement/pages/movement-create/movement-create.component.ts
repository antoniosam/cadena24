import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MovementStateService } from '../../services/movement-state.service';
import { ProductsApiService } from '../../../products/services/products-api.service';
import { WarehousesApiService } from '../../../warehouses/services/warehouses-api.service';
import { LocationsApiService } from '../../../locations/services/locations-api.service';
import { Product, Warehouse, Location } from '@cadena24-wms/shared';

@Component({
  selector: 'app-movement-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './movement-create.component.html',
  styleUrl: './movement-create.component.scss',
})
export class MovementCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly state = inject(MovementStateService);
  private readonly productsApi = inject(ProductsApiService);
  private readonly warehousesApi = inject(WarehousesApiService);
  private readonly locationsApi = inject(LocationsApiService);

  form!: FormGroup;

  warehouses = signal<Warehouse[]>([]);
  products = signal<Product[]>([]);
  locations = signal<Location[]>([]);
  loadingWarehouses = signal(false);
  loadingProducts = signal(false);
  loadingLocations = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  readonly movementTypes = [
    { value: 'PUTAWAY', label: 'Guardado (Recepción → Almacenamiento)' },
    { value: 'REPLENISHMENT', label: 'Reabastecimiento (Almacenamiento → Picking)' },
    { value: 'CONSOLIDATION', label: 'Consolidación (Varios → Una ubicación)' },
    { value: 'RELOCATION', label: 'Reubicación (Reorganización de almacén)' },
  ];

  ngOnInit() {
    this.buildForm();
    this.loadWarehouses();
    this.loadProducts();
    this.addLine();
  }

  private buildForm() {
    this.form = this.fb.group({
      warehouseId: [null, Validators.required],
      movementType: ['PUTAWAY', Validators.required],
      reason: [''],
      notes: [''],
      lines: this.fb.array([]),
    });

    // Load locations when warehouse changes
    this.form.get('warehouseId')?.valueChanges.subscribe((warehouseId) => {
      if (warehouseId) {
        this.loadLocations(Number(warehouseId));
      } else {
        this.locations.set([]);
      }
    });
  }

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  private createLineGroup(): FormGroup {
    return this.fb.group({
      productId: [null, Validators.required],
      fromLocationId: [null, Validators.required],
      toLocationId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
    });
  }

  addLine() {
    this.lines.push(this.createLineGroup());
  }

  removeLine(index: number) {
    if (this.lines.length > 1) {
      this.lines.removeAt(index);
    }
  }

  loadWarehouses() {
    this.loadingWarehouses.set(true);
    this.warehousesApi.getAll({ isActive: true }).subscribe({
      next: (res) => {
        this.warehouses.set(res.items);
        this.loadingWarehouses.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar almacenes: ' + (err.error?.message ?? err.message));
        this.loadingWarehouses.set(false);
      },
    });
  }

  loadProducts() {
    this.loadingProducts.set(true);
    this.productsApi.getProducts({ isActive: true, limit: 1000 }).subscribe({
      next: (res) => {
        this.products.set(res.items);
        this.loadingProducts.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar productos: ' + (err.error?.message ?? err.message));
        this.loadingProducts.set(false);
      },
    });
  }

  loadLocations(warehouseId: number) {
    this.loadingLocations.set(true);
    this.locationsApi.getAll({ warehouseId, isActive: true, limit: 1000 }).subscribe({
      next: (res) => {
        this.locations.set(res.items);
        this.loadingLocations.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar ubicaciones: ' + (err.error?.message ?? err.message));
        this.loadingLocations.set(false);
      },
    });
  }

  getProductLabel(productId: number): string {
    const p = this.products().find((p) => p.id === productId);
    return p ? `${p.code} — ${p.name}` : '';
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor complete todos los campos requeridos');
      return;
    }

    if (this.lines.length === 0) {
      this.error.set('Debe agregar al menos una línea de movimiento');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const raw = this.form.value;

    const dto = {
      warehouseId: Number(raw.warehouseId),
      movementType: raw.movementType,
      reason: raw.reason || undefined,
      notes: raw.notes || undefined,
      lines: raw.lines.map((l: any) => ({
        productId: Number(l.productId),
        fromLocationId: Number(l.fromLocationId),
        toLocationId: Number(l.toLocationId),
        quantity: Number(l.quantity),
      })),
    };

    this.state.createOrder(
      dto,
      (order) => {
        this.submitting.set(false);
        alert(`Orden ${order.orderNumber} creada exitosamente`);
        this.router.navigate(['/wms/movement']);
      },
      (msg) => {
        this.error.set(msg);
        this.submitting.set(false);
      }
    );
  }

  onCancel() {
    if (confirm('¿Cancelar? Los datos no guardados se perderán.')) {
      this.router.navigate(['/wms/movement']);
    }
  }

  fieldError(name: string): string | null {
    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.hasError('required')) return 'Campo requerido';
    return 'Valor inválido';
  }

  lineError(i: number, field: string): string | null {
    const ctrl = this.lines.at(i).get(field);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.hasError('required')) return 'Requerido';
    if (ctrl.hasError('min')) return 'Mayor a 0';
    return 'Inválido';
  }
}
