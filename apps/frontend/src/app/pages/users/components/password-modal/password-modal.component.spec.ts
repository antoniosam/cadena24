import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { PasswordModalComponent } from './password-modal.component';
import { UsersStateService } from '../../services/users.state.service';
import { signal } from '@angular/core';

const createMockStateService = () => ({
  passwordModalOpen: signal(false),
  passwordModalUserId: signal<number | null>(null),
  passwordSaving: signal(false),
  passwordError: signal<string | null>(null),
  changePassword: jest.fn(),
  closePasswordModal: jest.fn(),
});

describe('PasswordModalComponent', () => {
  let component: PasswordModalComponent;
  let fixture: ComponentFixture<PasswordModalComponent>;
  let mockState: ReturnType<typeof createMockStateService>;

  beforeEach(async () => {
    mockState = createMockStateService();

    await TestBed.configureTestingModule({
      imports: [PasswordModalComponent, ReactiveFormsModule],
      providers: [{ provide: UsersStateService, useValue: mockState }],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Visibility control ─────────────────────────────────────────────────────

  it('1 — modal NOT rendered when passwordModalOpen signal is false', () => {
    mockState.passwordModalOpen.set(false);
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('.modal');
    expect(modal).toBeFalsy();
  });

  it('2 — modal IS rendered when passwordModalOpen signal is true', () => {
    mockState.passwordModalOpen.set(true);
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('.modal');
    expect(modal).toBeTruthy();
  });

  it('3 — same component instance after signal change', () => {
    const instance = component;
    mockState.passwordModalOpen.set(true);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBe(instance);
  });

  // ── Form fields ────────────────────────────────────────────────────────────

  it('4 — has currentPassword field when modal is open', () => {
    mockState.passwordModalOpen.set(true);
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input[type="password"]');
    expect(inputs.length).toBeGreaterThanOrEqual(3);
  });

  it('5 — has newPassword field when modal is open', () => {
    mockState.passwordModalOpen.set(true);
    fixture.detectChanges();
    expect(component.form.get('newPassword')).toBeTruthy();
  });

  it('6 — has confirmPassword field when modal is open', () => {
    mockState.passwordModalOpen.set(true);
    fixture.detectChanges();
    expect(component.form.get('confirmPassword')).toBeTruthy();
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it('7 — newPassword with 7 chars fails minlength', () => {
    component.form.patchValue({ newPassword: 'Short1A' });
    component.form.get('newPassword')?.markAsTouched();
    expect(component.form.get('newPassword')?.errors?.['minlength']).toBeTruthy();
  });

  it('8 — newPassword without uppercase fails pattern', () => {
    component.form.patchValue({ newPassword: 'lowercase1' });
    component.form.get('newPassword')?.markAsTouched();
    expect(component.getError('newPassword')).toBe('Debe contener mayúscula, minúscula y número');
  });

  it('9 — submit with newPassword !== confirmPassword shows mismatch error', () => {
    component.form.patchValue({
      currentPassword: 'Old1234',
      newPassword: 'NewPass1',
      confirmPassword: 'Different1',
    });
    component.onSubmit();
    expect(component.passwordsMatchError).toBe(true);
  });

  it('10 — submit button disabled when passwordSaving is true', () => {
    mockState.passwordModalOpen.set(true);
    mockState.passwordSaving.set(true);
    fixture.detectChanges();
    const submitBtn = fixture.nativeElement.querySelector('.modal-footer .btn-primary');
    expect(submitBtn.disabled).toBe(true);
  });

  // ── Actions ────────────────────────────────────────────────────────────────

  it('11 — valid submit calls state.changePassword() with all 3 fields', () => {
    component.form.patchValue({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
      confirmPassword: 'NewPass1',
    });
    component.onSubmit();
    expect(mockState.changePassword).toHaveBeenCalledWith({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
      confirmPassword: 'NewPass1',
    });
  });

  it('12 — dismiss button calls state.closePasswordModal()', () => {
    mockState.passwordModalOpen.set(true);
    fixture.detectChanges();
    component.onDismiss();
    expect(mockState.closePasswordModal).toHaveBeenCalledTimes(1);
  });

  it('13 — dismiss resets form and passwordsMatchError', () => {
    component.form.patchValue({ currentPassword: 'test' });
    component.passwordsMatchError = true;
    component.onDismiss();
    expect(component.form.get('currentPassword')?.value).toBeNull();
    expect(component.passwordsMatchError).toBe(false);
  });

  it('14 — passwordSaving=true shows spinner in submit button', () => {
    mockState.passwordModalOpen.set(true);
    mockState.passwordSaving.set(true);
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('.spinner-border-sm');
    expect(spinner).toBeTruthy();
  });

  it('15 — passwordError from state is displayed in alert', () => {
    mockState.passwordModalOpen.set(true);
    mockState.passwordError.set('La contraseña actual es incorrecta');
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('.alert-danger');
    expect(alert?.textContent?.trim()).toBe('La contraseña actual es incorrecta');
  });
});
