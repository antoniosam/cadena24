import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClassificationsApiService } from '../../services/classifications-api.service';
import { ClassificationsStateService } from '../../services/classifications-state.service';

@Component({
  selector: 'app-classification-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './classification-form.component.html',
  styleUrl: './classification-form.component.scss',
})
export class ClassificationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private api = inject(ClassificationsApiService);
  protected state = inject(ClassificationsStateService);

  classificationForm: FormGroup;
  isEditMode = false;
  classificationId: number | null = null;

  constructor() {
    this.classificationForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      isActive: [true],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.classificationId = parseInt(id, 10);
      this.loadClassification(this.classificationId);
    }
  }

  loadClassification(id: number) {
    this.api.getClassification(id).subscribe({
      next: (classification) => {
        this.state.selectedClassification.set(classification);
        this.classificationForm.patchValue({
          code: classification.code,
          name: classification.name,
          isActive: classification.isActive,
        });
      },
      error: (err) => {
        this.state.error.set(err.error?.message ?? err.message);
      },
    });
  }

  onSubmit() {
    if (this.classificationForm.invalid) {
      this.classificationForm.markAllAsTouched();
      return;
    }

    const formValue = this.classificationForm.value;

    if (this.isEditMode && this.classificationId) {
      this.state.updateClassification(this.classificationId, formValue).subscribe({
        next: () => {
          this.router.navigate(['/wms/classifications']);
        },
        error: (err) => {
          console.error('Error updating classification:', err);
        },
      });
    } else {
      this.state.createClassification(formValue).subscribe({
        next: () => {
          this.router.navigate(['/wms/classifications']);
        },
        error: (err) => {
          console.error('Error creating classification:', err);
        },
      });
    }
  }

  onCancel() {
    this.router.navigate(['/wms/classifications']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.classificationForm.get(fieldName);
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
