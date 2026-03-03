import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { UserFormComponent } from './user-form.component';
import { IUser, ROLE_LABELS, RoleCode } from '@cadena24-wms/shared';

const mockUser: IUser = {
  id: 1,
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  birthday: '1990-05-15T00:00:00.000Z',
  role: RoleCode.USER,
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('1 — shows title "Nuevo Usuario" in create mode', () => {
    component.mode = 'create';
    fixture.detectChanges();
    const h5 = fixture.nativeElement.querySelector('h5');
    expect(h5.textContent.trim()).toBe('Nuevo Usuario');
  });

  it('2 — shows title "Editar Usuario" in edit mode', () => {
    component.mode = 'edit';
    fixture.detectChanges();
    const h5 = fixture.nativeElement.querySelector('h5');
    expect(h5.textContent.trim()).toBe('Editar Usuario');
  });

  it('3 — password field IS visible in create mode', () => {
    component.mode = 'create';
    fixture.detectChanges();
    // In create mode, the template renders the password col
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Contraseña');
  });

  it('4 — password field is NOT visible in edit mode', () => {
    component.mode = 'edit';
    fixture.detectChanges();
    // In edit mode, the password column is not rendered
    const formLabels: string = fixture.nativeElement.textContent;
    // "Contraseña" would only appear as a label in create mode password field
    // In edit mode it should not contain password input label
    const passwordInputs = fixture.nativeElement.querySelectorAll('input[type="password"]');
    expect(passwordInputs.length).toBe(0);
  });

  it('5 — role dropdown renders 3 options with Spanish labels', () => {
    component.mode = 'create';
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('select option');
    const texts: string[] = Array.from(options as NodeListOf<HTMLOptionElement>).map(
      (o) => o.textContent?.trim() ?? ''
    );
    expect(texts).toContain(ROLE_LABELS[RoleCode.USER]);
    expect(texts).toContain(ROLE_LABELS[RoleCode.ADMIN]);
    expect(texts).toContain(ROLE_LABELS[RoleCode.MANAGER]);
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it('6 — form is invalid when firstName is empty', () => {
    fixture.detectChanges();
    component.form.patchValue({
      firstName: '',
      lastName: 'Doe',
      email: 'test@test.com',
      password: 'Pass1234',
    });
    expect(component.form.get('firstName')?.invalid).toBe(true);
  });

  it('7 — firstName with 1 char fails minlength(2)', () => {
    fixture.detectChanges();
    component.form.patchValue({ firstName: 'A' });
    const ctrl = component.form.get('firstName');
    expect(ctrl?.errors?.['minlength']).toBeTruthy();
  });

  it('8 — email with invalid format shows Spanish error message', () => {
    fixture.detectChanges();
    component.form.patchValue({ email: 'not-an-email' });
    component.form.get('email')?.markAsTouched();
    expect(component.getError('email')).toBe('El correo electrónico no es válido');
  });

  it('9 — submit with invalid form marks all controls as touched', () => {
    fixture.detectChanges();
    const markSpy = jest.spyOn(component.form, 'markAllAsTouched');
    component.onSubmit();
    expect(markSpy).toHaveBeenCalled();
  });

  it('10 — submit does NOT emit when form is invalid', () => {
    fixture.detectChanges();
    const spy = jest.fn();
    component.saved.subscribe(spy);
    component.form.patchValue({ firstName: '', lastName: '', email: 'bad', password: '' });
    component.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  // ── Form population (edit mode) ────────────────────────────────────────────

  it('11 — setting @Input() user populates firstName and lastName', () => {
    component.mode = 'edit';
    component.user = mockUser;
    component.ngOnChanges({
      user: {
        currentValue: mockUser,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
      mode: {
        currentValue: 'edit',
        previousValue: 'create',
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    fixture.detectChanges();
    expect(component.form.value.firstName).toBe('John');
    expect(component.form.value.lastName).toBe('Doe');
  });

  it('12 — setting @Input() user populates email field', () => {
    component.mode = 'edit';
    component.user = mockUser;
    component.ngOnChanges({
      user: {
        currentValue: mockUser,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();
    expect(component.form.value.email).toBe('john@example.com');
  });

  it('13 — birthday is formatted to YYYY-MM-DD for date input', () => {
    component.mode = 'edit';
    component.user = mockUser;
    component.ngOnChanges({
      user: {
        currentValue: mockUser,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();
    expect(component.form.value.birthday).toBe('1990-05-15');
  });

  // ── Submission ────────────────────────────────────────────────────────────

  it('14 — valid create form emits ICreateUser with all fields including password', () => {
    component.mode = 'create';
    fixture.detectChanges();
    const spy = jest.fn();
    component.saved.subscribe(spy);
    component.form.patchValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      password: 'Pass1234',
      role: RoleCode.USER,
    });
    component.onSubmit();
    expect(spy).toHaveBeenCalledTimes(1);
    const emitted = spy.mock.calls[0][0];
    expect(emitted.password).toBeDefined();
  });

  it('15 — valid edit form emits IUpdateUser WITHOUT password key', () => {
    component.mode = 'edit';
    component.user = mockUser;
    component.ngOnChanges({
      mode: {
        currentValue: 'edit',
        previousValue: 'create',
        firstChange: false,
        isFirstChange: () => false,
      },
      user: {
        currentValue: mockUser,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();
    const spy = jest.fn();
    component.saved.subscribe(spy);
    component.form.patchValue({
      firstName: 'Updated',
      lastName: 'Name',
      email: 'updated@test.com',
    });
    component.onSubmit();
    expect(spy).toHaveBeenCalledTimes(1);
    const emitted = spy.mock.calls[0][0];
    expect(emitted.password).toBeUndefined();
  });

  it('16 — Cancel button emits cancelled event', () => {
    fixture.detectChanges();
    const spy = jest.fn();
    component.cancelled.subscribe(spy);
    component.onCancel();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
