import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProvidersApiService } from '../../services/providers-api.service';
import { ProvidersStateService } from '../../services/providers-state.service';

@Component({
  selector: 'app-provider-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './provider-form.component.html',
  styleUrl: './provider-form.component.scss',
})
export class ProviderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ProvidersApiService);
  protected state = inject(ProvidersStateService);

  providerForm: FormGroup;
  isEditMode = false;
  providerId: number | null = null;

  constructor() {
    this.providerForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      isActive: [true],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.providerId = parseInt(id, 10);
      this.loadProvider(this.providerId);
    }
  }

  loadProvider(id: number) {
    this.api.getProvider(id).subscribe({
      next: (provider) => {
        this.state.selectedProvider.set(provider);
        this.providerForm.patchValue({
          code: provider.code,
          name: provider.name,
          isActive: provider.isActive,
        });
      },
      error: (err) => {
        this.state.error.set(err.error?.message ?? err.message);
      },
    });
  }

  onSubmit() {
    if (this.providerForm.invalid) {
      this.providerForm.markAllAsTouched();
      return;
    }

    const formValue = this.providerForm.value;

    if (this.isEditMode && this.providerId) {
      this.state.updateProvider(this.providerId, formValue).subscribe({
        next: () => {
          this.router.navigate(['/wms/providers']);
        },
        error: (err) => {
          console.error('Error updating provider:', err);
        },
      });
    } else {
      this.state.createProvider(formValue).subscribe({
        next: () => {
          this.router.navigate(['/wms/providers']);
        },
        error: (err) => {
          console.error('Error creating provider:', err);
        },
      });
    }
  }

  onCancel() {
    this.router.navigate(['/wms/providers']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.providerForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('maxlength')) {
      const errors = control.errors;
      return `Longitud máxima: ${errors?.['maxlength'].requiredLength}`;
    }
    return '';
  }
}
