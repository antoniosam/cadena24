import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginPageComponent } from './login-page.component';
import { AuthStateService } from './services/auth-state.service';
import { signal } from '@angular/core';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  // Use real signals for the mock so Angular change detection works properly
  const isAuthenticatedSig = signal(false);
  const loadingSig = signal(false);
  const errorSig = signal<string | null>(null);

  const mockAuthState = {
    get isAuthenticated() {
      return isAuthenticatedSig;
    },
    get loading() {
      return loadingSig;
    },
    get error() {
      return errorSig;
    },
    login: jest.fn(),
    clearError: jest.fn(),
  };

  const mockRouter = {
    navigate: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    // Reset signals before each test
    isAuthenticatedSig.set(false);
    loadingSig.set(false);
    errorSig.set(null);
    mockAuthState.login.mockClear();
    mockAuthState.clearError.mockClear();
    mockRouter.navigate.mockClear();

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthStateService, useValue: mockAuthState },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('1 — renders email input', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('input[type="email"]')).toBeTruthy();
  });

  it('2 — renders password input', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('3 — renders submit button', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it('4 — submit button shows spinner when loading() is true', () => {
    loadingSig.set(true);
    fixture.detectChanges();
    fixture.detectChanges(); // second pass to stabilize
    const spinner = (fixture.nativeElement as HTMLElement).querySelector('.spinner-border');
    expect(spinner).toBeTruthy();
  });

  it('5 — submit button shows "Iniciar sesión" text when not loading', () => {
    loadingSig.set(false);
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]');
    expect(btn?.textContent).toContain('Iniciar sesión');
  });

  it('6 — error alert rendered when error() signal has value', () => {
    errorSig.set('Credenciales incorrectas');
    fixture.detectChanges();
    fixture.detectChanges(); // second pass
    const alert = (fixture.nativeElement as HTMLElement).querySelector('.alert-danger');
    expect(alert).toBeTruthy();
  });

  it('7 — error alert NOT rendered when error() is null', () => {
    errorSig.set(null);
    fixture.detectChanges();
    const alert = (fixture.nativeElement as HTMLElement).querySelector('.alert-danger');
    expect(alert).toBeFalsy();
  });

  // ── Redirect on init ──────────────────────────────────────────────────────

  it('8 — navigates to /dashboard on ngOnInit when already authenticated', () => {
    isAuthenticatedSig.set(true);
    component.ngOnInit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('9 — does NOT navigate on ngOnInit when not authenticated', () => {
    isAuthenticatedSig.set(false);
    component.ngOnInit();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it('10 — submitting empty form marks all fields as touched', () => {
    component.onSubmit();
    expect(component.form.get('email')?.touched).toBe(true);
    expect(component.form.get('password')?.touched).toBe(true);
  });

  it('11 — does NOT call state.login() when form is invalid', () => {
    component.form.get('email')?.setValue('');
    component.form.get('password')?.setValue('');
    component.onSubmit();
    expect(mockAuthState.login).not.toHaveBeenCalled();
  });

  it('12 — email field shows error for bad format', () => {
    const emailCtrl = component.form.get('email');
    emailCtrl?.setValue('not-an-email');
    emailCtrl?.markAsTouched();
    fixture.detectChanges();
    const error = component.getError('email');
    expect(error).toBe('El correo electrónico no es válido');
  });

  it('13 — password field shows "Este campo es obligatorio" when empty', () => {
    const pwdCtrl = component.form.get('password');
    pwdCtrl?.setValue('');
    pwdCtrl?.markAsTouched();
    fixture.detectChanges();
    const error = component.getError('password');
    expect(error).toBe('Este campo es obligatorio');
  });

  // ── Interaction ───────────────────────────────────────────────────────────

  it('14 — valid submit calls state.login(email, password)', () => {
    component.form.get('email')?.setValue('user@test.com');
    component.form.get('password')?.setValue('mypassword');
    component.onSubmit();
    expect(mockAuthState.login).toHaveBeenCalledWith('user@test.com', 'mypassword');
  });

  it('15 — togglePassword() changes showPassword from false to true', () => {
    expect(component.showPassword).toBe(false);
    component.togglePassword();
    expect(component.showPassword).toBe(true);
    // The template binding [type]="showPassword ? 'text' : 'password'" will update on next CD cycle
    // Use fixture.componentInstance directly to verify logic, not DOM (avoids ExpressionChangedError)
    expect(component.showPassword).toBe(true);
  });

  it('16 — clicking error close button calls state.clearError()', () => {
    errorSig.set('Some error');
    fixture.detectChanges();
    fixture.detectChanges(); // second pass
    const closeBtn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.btn-close'
    );
    closeBtn?.click();
    expect(mockAuthState.clearError).toHaveBeenCalled();
  });
});
