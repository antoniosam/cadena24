import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { WarehousesApiService } from '../../services/warehouses-api.service';
import { WarehousesStateService } from '../../services/warehouses-state.service';

@Component({
  selector: 'app-warehouse-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './warehouse-form.component.html',
  styleUrl: './warehouse-form.component.scss',
})
export class WarehouseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(WarehousesApiService);
  protected state = inject(WarehousesStateService);

  warehouseForm: FormGroup;
  isEditMode = false;
  warehouseId: number | null = null;

  constructor() {
    this.warehouseForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      address: [''],
      city: ['', Validators.maxLength(100)],
      state: ['', Validators.maxLength(100)],
      zipCode: ['', Validators.maxLength(20)],
      isPrimary: [false],
      isActive: [true],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.warehouseId = parseInt(id, 10);
      this.loadWarehouse(this.warehouseId);
    }
  }

  loadWarehouse(id: number) {
    this.api.getOne(id).subscribe({
      next: (warehouse) => {
        this.state.selectedWarehouse.set(warehouse);
        this.warehouseForm.patchValue({
          code: warehouse.code,
          name: warehouse.name,
          address: warehouse.address || '',
          city: warehouse.city || '',
          state: warehouse.state || '',
          zipCode: warehouse.zipCode || '',
          isPrimary: warehouse.isPrimary,
          isActive: warehouse.isActive,
        });
      },
      error: (err) => {
        this.state.error.set(err.error?.message ?? err.message);
      },
    });
  }

  onSubmit() {
    if (this.warehouseForm.invalid) {
      this.warehouseForm.markAllAsTouched();
      return;
    }

    const formValue = this.warehouseForm.value;

    if (this.isEditMode && this.warehouseId) {
      this.state.updateWarehouse(this.warehouseId, formValue).subscribe({
        next: () => {
          this.router.navigate(['/wms/warehouses']);
        },
        error: (err) => {
          console.error('Error updating warehouse:', err);
        },
      });
    } else {
      this.state.createWarehouse(formValue).subscribe({
        next: () => {
          this.router.navigate(['/wms/warehouses']);
        },
        error: (err) => {
          console.error('Error creating warehouse:', err);
        },
      });
    }
  }

  onCancel() {
    this.router.navigate(['/wms/warehouses']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.warehouseForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('maxLength')) {
      return `Longitud máxima excedida`;
    }
    return '';
  }
}
