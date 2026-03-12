import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductsStateService } from '../../services/products-state.service';
import { ProductsApiService } from '../../services/products-api.service';
import { ProductBulkUploadComponent } from './product-bulk-upload/product-bulk-upload.component';
import { ClassificationsApiService } from '../../../classifications/services/classifications-api.service';
import { Classification } from '@cadena24-wms/shared';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProductBulkUploadComponent],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ProductsApiService);
  protected state = inject(ProductsStateService);
  private classificationsApi = inject(ClassificationsApiService);

  form: FormGroup;
  isEditMode = false;
  productId: number | null = null;
  showBulkUpload = signal<boolean>(false);
  classifications = signal<Classification[]>([]);

  constructor() {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      barcode: ['', [Validators.required, Validators.maxLength(48)]],
      description: [''],
      category: [''],
      uom: ['UND', [Validators.required, Validators.maxLength(20)]],
      minStock: [0, [Validators.required, Validators.min(0)]],
      maxStock: [0, [Validators.required, Validators.min(0)]],
      reorderPoint: [0, [Validators.required, Validators.min(0)]],
      reorderQuantity: [0, [Validators.required, Validators.min(0)]],
      weight: [0, [Validators.min(0)]],
      width: [0, [Validators.min(0)]],
      height: [0, [Validators.min(0)]],
      depth: [0, [Validators.min(0)]],
      isActive: [true],
      classificationId: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.classificationsApi.getClassifications({ isActive: true, limit: 100 }).subscribe({
      next: (res: any) => this.classifications.set(res.items),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.productId = parseInt(id, 10);
      this.api.getProduct(this.productId).subscribe({
        next: (product) => {
          // Extract first barcode from barcodes array
          const barcode =
            product.barcodes && product.barcodes.length > 0 ? product.barcodes[0].barcode : '';

          this.form.patchValue({
            code: product.code,
            name: product.name,
            barcode: barcode,
            description: product.description ?? '',
            category: product.category ?? '',
            uom: product.uom,
            minStock: product.minStock,
            maxStock: product.maxStock,
            reorderPoint: product.reorderPoint,
            reorderQuantity: product.reorderQuantity,
            weight: product.weight ?? 0,
            width: product.width ?? 0,
            height: product.height ?? 0,
            depth: product.depth ?? 0,
            isActive: product.isActive,
            classificationId: product.classificationId,
          });
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = this.form.value;

    if (this.isEditMode && this.productId) {
      this.state.updateProduct(this.productId, dto).subscribe({
        next: () => this.router.navigate(['/wms/products']),
      });
    } else {
      this.state.createProduct(dto).subscribe({
        next: () => this.router.navigate(['/wms/products']),
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/wms/products']);
  }

  openBulkUpload(): void {
    this.showBulkUpload.set(true);
  }

  onBulkUploadClosed(hadSuccess: boolean): void {
    this.showBulkUpload.set(false);
    if (hadSuccess) {
      this.router.navigate(['/wms/products']);
    }
  }

  fieldError(name: string): string | null {
    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.hasError('required')) return 'Campo requerido';
    if (ctrl.hasError('min')) return 'Debe ser mayor o igual a 0';
    if (ctrl.hasError('maxlength')) return 'Longitud máxima excedida';
    return 'Valor inválido';
  }
}
