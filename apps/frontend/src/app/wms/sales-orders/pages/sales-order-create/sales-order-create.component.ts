import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SalesOrdersApiService } from '../../services/sales-orders-api.service';
import { ProductsApiService } from '../../../products/services/products-api.service';
import { ClientsApiService } from '../../../clients/services/clients-api.service';
import { Product, Client, StockValidationResult } from '@cadena24-wms/shared';

@Component({
  selector: 'app-sales-order-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sales-order-create.component.html',
  styleUrl: './sales-order-create.component.scss',
})
export class SalesOrderCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private salesOrdersApi = inject(SalesOrdersApiService);
  private productsApi = inject(ProductsApiService);
  private clientsApi = inject(ClientsApiService);

  form: FormGroup;
  products = signal<Product[]>([]);
  clients = signal<Client[]>([]);
  loadingProducts = signal<boolean>(false);
  loadingClients = signal<boolean>(false);
  submitting = signal<boolean>(false);
  validatingStock = signal<boolean>(false);
  error = signal<string | null>(null);
  stockValidation = signal<StockValidationResult | null>(null);

  readonly priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
  ];

  constructor() {
    this.form = this.fb.group({
      clientId: [null, [Validators.required]],
      requiredDate: [''],
      priority: ['normal', [Validators.required]],
      notes: [''],
      lines: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadClients();
    this.addLine();
  }

  loadClients(): void {
    this.loadingClients.set(true);
    this.clientsApi.getClients({ isActive: true, limit: 1000 }).subscribe({
      next: (response) => {
        this.clients.set(response.items);
        this.loadingClients.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar clientes: ' + (err.error?.message || err.message));
        this.loadingClients.set(false);
      },
    });
  }

  loadProducts(): void {
    this.loadingProducts.set(true);
    this.productsApi.getProducts({ isActive: true, limit: 1000 }).subscribe({
      next: (response) => {
        this.products.set(response.items);
        this.loadingProducts.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar productos: ' + (err.error?.message || err.message));
        this.loadingProducts.set(false);
      },
    });
  }

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  createLineFormGroup(): FormGroup {
    return this.fb.group({
      productId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      notes: [''],
    });
  }

  addLine(): void {
    this.lines.push(this.createLineFormGroup());
    this.stockValidation.set(null);
  }

  removeLine(index: number): void {
    if (this.lines.length > 1) {
      this.lines.removeAt(index);
      this.stockValidation.set(null);
    }
  }

  onProductChange(lineIndex: number, event: Event): void {
    const productId = Number((event.target as HTMLSelectElement).value);
    const product = this.products().find((p) => p.id === productId);
    if (product) {
      // unitPrice left for manual input — no price field in Product interface
      this.lines.at(lineIndex).get('productId')?.setValue(productId);
    }
    this.stockValidation.set(null);
  }

  validateStock(): void {
    const linesWithProducts = this.lines.controls
      .filter((ctrl) => ctrl.get('productId')?.value)
      .map((ctrl) => ({
        productId: Number(ctrl.get('productId')?.value),
        quantity: Number(ctrl.get('quantity')?.value),
      }));

    if (linesWithProducts.length === 0) return;

    this.validatingStock.set(true);
    this.salesOrdersApi.validateStock({ items: linesWithProducts }).subscribe({
      next: (result) => {
        this.stockValidation.set(result);
        this.validatingStock.set(false);
      },
      error: (err) => {
        this.error.set('Error al validar stock: ' + (err.error?.message || err.message));
        this.validatingStock.set(false);
      },
    });
  }

  getStockValidationForLine(productId: number) {
    return this.stockValidation()?.items.find((i) => i.productId === productId);
  }

  getProductName(productId: number): string {
    const product = this.products().find((p) => p.id === productId);
    return product ? `${product.code} — ${product.name}` : '';
  }

  getTotalAmount(): number {
    return this.lines.controls.reduce((sum, ctrl) => {
      const qty = Number(ctrl.get('quantity')?.value) || 0;
      const price = Number(ctrl.get('unitPrice')?.value) || 0;
      return sum + qty * price;
    }, 0);
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

    if (this.stockValidation() && !this.stockValidation()!.valid) {
      this.error.set('Hay productos con stock insuficiente. Valida el stock antes de continuar.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const formValue = this.form.value;
    const dto = {
      clientId: Number(formValue.clientId),
      requiredDate: formValue.requiredDate || undefined,
      priority: formValue.priority,
      notes: formValue.notes || undefined,
      lines: formValue.lines.map(
        (line: { productId: string; quantity: string; unitPrice: string; notes: string }) => ({
          productId: Number(line.productId),
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          notes: line.notes || undefined,
        })
      ),
    };

    this.salesOrdersApi.createSalesOrder(dto).subscribe({
      next: (order) => {
        alert(
          `Orden de venta ${order.orderNumber} creada exitosamente. Inventario reservado automáticamente.`
        );
        this.router.navigate(['/wms/sales-orders', order.id]);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al crear la orden de venta');
        this.submitting.set(false);
      },
    });
  }

  onCancel(): void {
    if (confirm('¿Está seguro de cancelar? Los datos no guardados se perderán.')) {
      this.router.navigate(['/wms/sales-orders']);
    }
  }

  fieldError(name: string): string | null {
    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.hasError('required')) return 'Campo requerido';
    if (ctrl.hasError('email')) return 'Email inválido';
    if (ctrl.hasError('maxlength')) return 'Longitud máxima excedida';
    return 'Valor inválido';
  }

  lineFieldError(lineIndex: number, fieldName: string): string | null {
    const ctrl = this.lines.at(lineIndex).get(fieldName);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.hasError('required')) return 'Requerido';
    if (ctrl.hasError('min')) return 'Debe ser mayor a 0';
    return 'Inválido';
  }
}
