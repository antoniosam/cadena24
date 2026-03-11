import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientsStateService } from '../../services/clients-state.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss',
})
export class ClientFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected state = inject(ClientsStateService);

  form: FormGroup;
  isEdit = signal<boolean>(false);
  clientId = signal<number | null>(null);

  constructor() {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      phone: ['', [Validators.maxLength(50)]],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      address: ['', [Validators.maxLength(255)]],
      city: ['', [Validators.maxLength(100)]],
      state: ['', [Validators.maxLength(100)]],
      zipCode: ['', [Validators.maxLength(20)]],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.clientId.set(Number(id));
      this.loadClient(Number(id));
    }
  }

  loadClient(id: number): void {
    this.state.loadClient(id);
    // Subscribe to selectedClient to patch form
    // In a real app, we might use an effect or just handle it in the service
    this.state.api.getClient(id).subscribe({
      next: (client) => {
        this.form.patchValue(client);
      },
      error: (err) => {
        this.state.error.set('Error al cargar datos del cliente');
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    if (this.isEdit()) {
      this.state.updateClient(this.clientId()!, val, () => {
        this.router.navigate(['/wms/clients']);
      });
    } else {
      this.state.createClient(val, () => {
        this.router.navigate(['/wms/clients']);
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/wms/clients']);
  }

  fieldError(name: string): string | null {
    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.hasError('required')) return 'Campo requerido';
    if (ctrl.hasError('email')) return 'Email inválido';
    if (ctrl.hasError('maxlength')) return 'Longitud máxima excedida';
    return 'Valor inválido';
  }
}
