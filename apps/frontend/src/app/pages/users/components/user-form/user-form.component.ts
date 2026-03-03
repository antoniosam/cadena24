import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ICreateUser, IUpdateUser, IUser, ROLE_LABELS, RoleCode } from '@cadena24-wms/shared';

export type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnChanges {
  @Input() mode: FormMode = 'create';
  @Input() user: IUser | null = null;
  @Input() saving = false;
  @Input() serverError: string | null = null;

  @Output() saved = new EventEmitter<ICreateUser | IUpdateUser>();
  @Output() cancelled = new EventEmitter<void>();

  readonly roles = Object.values(RoleCode);
  readonly roleLabels = ROLE_LABELS;

  form: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.form.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        birthday: this.user.birthday ? this.user.birthday.substring(0, 10) : null,
        role: this.user.role,
      });
    }
    if (changes['mode']) {
      const passwordControl = this.form.get('password');
      if (this.mode === 'edit') {
        passwordControl?.clearValidators();
      } else {
        passwordControl?.setValidators([Validators.required, Validators.minLength(8)]);
      }
      passwordControl?.updateValueAndValidity();
    }
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      birthday: [null],
      role: [RoleCode.USER, [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    if (this.mode === 'create') {
      const dto: ICreateUser = {
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        password: value.password,
        birthday: value.birthday ?? undefined,
        role: value.role,
      };
      this.saved.emit(dto);
    } else {
      const dto: IUpdateUser = {
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        birthday: value.birthday ?? null,
      };
      this.saved.emit(dto);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors) return '';
    if (ctrl.errors['required']) return 'Este campo es obligatorio';
    if (ctrl.errors['email']) return 'El correo electrónico no es válido';
    if (ctrl.errors['minlength'])
      return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    if (ctrl.errors['maxlength'])
      return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo no válido';
  }

  get title(): string {
    return this.mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario';
  }

  get submitLabel(): string {
    return this.mode === 'create' ? 'Crear usuario' : 'Guardar cambios';
  }
}
