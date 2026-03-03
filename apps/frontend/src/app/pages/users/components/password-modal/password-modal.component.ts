import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersStateService } from '../../services/users.state.service';

@Component({
  selector: 'app-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-modal.component.html',
  styleUrl: './password-modal.component.scss',
})
export class PasswordModalComponent {
  readonly state = inject(UsersStateService);

  form: FormGroup;
  passwordsMatchError = false;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    this.passwordsMatchError = false;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.form.value;
    if (newPassword !== confirmPassword) {
      this.passwordsMatchError = true;
      return;
    }
    this.state.changePassword({ currentPassword, newPassword, confirmPassword });
  }

  onDismiss(): void {
    this.form.reset();
    this.passwordsMatchError = false;
    this.state.closePasswordModal();
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors) return '';
    if (ctrl.errors['required']) return 'Este campo es obligatorio';
    if (ctrl.errors['minlength']) return 'Mínimo 8 caracteres';
    if (ctrl.errors['pattern']) return 'Debe contener mayúscula, minúscula y número';
    return 'Campo no válido';
  }
}
