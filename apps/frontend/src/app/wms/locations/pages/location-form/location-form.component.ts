import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Warehouse } from '@cadena24-wms/shared';
import { LocationsApiService } from '../../services/locations-api.service';
import { LocationsStateService } from '../../services/locations-state.service';
import { WarehousesApiService } from '../../../warehouses/services/warehouses-api.service';

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './location-form.component.html',
  styleUrl: './location-form.component.scss',
})
export class LocationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private locationsApi = inject(LocationsApiService);
  private warehousesApi = inject(WarehousesApiService);
  protected state = inject(LocationsStateService);

  locationForm: FormGroup;
  isEditMode = false;
  locationId: number | null = null;
  warehouses = signal<Warehouse[]>([]);

  // Computed full path preview
  fullPathPreview = computed(() => {
    const form = this.locationForm;
    if (!form) return '';
    const zone = form.get('zone')?.value || '?';
    const row = form.get('row')?.value || '?';
    const position = form.get('position')?.value || '?';
    const level = form.get('level')?.value || '?';
    return `${zone}-${row}-${position}-${level}`;
  });

  constructor() {
    this.locationForm = this.fb.group({
      warehouseId: [null, Validators.required],
      zone: ['', [Validators.required, Validators.maxLength(50)]],
      row: ['', [Validators.required, Validators.maxLength(50)]],
      position: ['', [Validators.required, Validators.maxLength(50)]],
      level: ['', [Validators.required, Validators.maxLength(50)]],
      barcode: ['', [Validators.required, Validators.maxLength(100)]],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      type: ['storage', Validators.required],
      capacity: [0, [Validators.required, Validators.min(0)]],
      maxWeight: [0, Validators.min(0)],
      height: [0, Validators.min(0)],
      allowMixedProducts: [false],
      isActive: [true],
    });
  }

  ngOnInit() {
    // Cargar lista de almacenes para el select
    this.warehousesApi.getAll({ isActive: true, limit: 100 } as any).subscribe({
      next: (res) => this.warehouses.set(res.items),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.locationId = parseInt(id, 10);
      this.loadLocation(this.locationId);
    }
  }

  loadLocation(id: number) {
    this.locationsApi.getOne(id).subscribe({
      next: (location) => {
        this.state.selectedLocation.set(location);
        this.locationForm.patchValue({
          warehouseId: location.warehouseId,
          zone: location.zone,
          row: location.row,
          position: location.position,
          level: location.level,
          barcode: location.barcode,
          name: location.name,
          type: location.type,
          capacity: location.capacity,
          maxWeight: location.maxWeight || 0,
          height: location.height || 0,
          allowMixedProducts: location.allowMixedProducts,
          isActive: location.isActive,
        });
      },
      error: (err) => {
        this.state.error.set(err.error?.message ?? err.message);
      },
    });
  }

  onSubmit() {
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }

    const formValue = this.locationForm.value;

    if (this.isEditMode && this.locationId) {
      this.state.updateLocation(this.locationId, formValue).subscribe({
        next: () => {
          this.router.navigate(['/wms/locations']);
        },
        error: (err) => {
          console.error('Error updating location:', err);
        },
      });
    } else {
      this.state.createLocation(formValue).subscribe({
        next: () => {
          this.router.navigate(['/wms/locations']);
        },
        error: (err) => {
          console.error('Error creating location:', err);
        },
      });
    }
  }

  onCancel() {
    this.router.navigate(['/wms/locations']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.locationForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('min')) {
      return 'El valor debe ser mayor o igual a 0';
    }
    if (control?.hasError('maxLength')) {
      return 'Longitud máxima excedida';
    }
    return '';
  }
}
