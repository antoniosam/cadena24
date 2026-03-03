import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserListComponent } from './user-list.component';
import { IUserSummary, ROLE_LABELS, RoleCode } from '@cadena24-wms/shared';

const mockUsers: IUserSummary[] = [
  {
    id: 1,
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: RoleCode.USER,
    active: true,
  },
  {
    id: 2,
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: RoleCode.ADMIN,
    active: false,
  },
];

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('1 — renders a <table> element', () => {
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector('table');
    expect(table).toBeTruthy();
  });

  it('2 — renders correct number of rows matching input array length', () => {
    component.users = mockUsers;
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(mockUsers.length);
  });

  it('3 — shows "No hay usuarios registrados" when users is empty', () => {
    component.users = [];
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('No hay usuarios registrados');
  });

  it('4 — displays firstName + lastName in name column', () => {
    component.users = [mockUsers[0]];
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('John Doe');
  });

  it('5 — displays ROLE_LABELS[role] badge (Spanish) for ADMIN', () => {
    component.users = [mockUsers[1]];
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain(ROLE_LABELS[RoleCode.ADMIN]);
  });

  it('6 — pagination controls hidden when totalPages <= 1', () => {
    component.users = mockUsers;
    component.pagination = null;
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeFalsy();
  });

  it('7 — pagination controls visible when totalPages > 1', () => {
    component.users = mockUsers;
    component.pagination = {
      page: 1,
      limit: 10,
      total: 20,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    };
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeTruthy();
  });

  // ── @Output emissions ──────────────────────────────────────────────────────

  it('8 — clicking edit button emits editUser with correct IUserSummary', () => {
    component.users = [mockUsers[0]];
    fixture.detectChanges();
    const spy = jest.fn();
    component.editUser.subscribe(spy);

    const editBtn = fixture.nativeElement.querySelector('button[title="Editar"]');
    editBtn.click();

    expect(spy).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('9 — clicking password button emits openPasswordModal with user.id', () => {
    component.users = [mockUsers[0]];
    fixture.detectChanges();
    const spy = jest.fn();
    component.openPasswordModal.subscribe(spy);

    const pwdBtn = fixture.nativeElement.querySelector('button[title="Cambiar contraseña"]');
    pwdBtn.click();

    expect(spy).toHaveBeenCalledWith(mockUsers[0].id);
  });

  it('10 — clicking delete with confirm=true emits deleteUser with user.id', () => {
    component.users = [mockUsers[0]];
    fixture.detectChanges();
    const spy = jest.fn();
    component.deleteUser.subscribe(spy);
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    const deleteBtn = fixture.nativeElement.querySelector('button[title="Eliminar"]');
    deleteBtn.click();

    expect(spy).toHaveBeenCalledWith(mockUsers[0].id);
  });

  it('11 — clicking delete with confirm=false does NOT emit deleteUser', () => {
    component.users = [mockUsers[0]];
    fixture.detectChanges();
    const spy = jest.fn();
    component.deleteUser.subscribe(spy);
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    const deleteBtn = fixture.nativeElement.querySelector('button[title="Eliminar"]');
    deleteBtn.click();

    expect(spy).not.toHaveBeenCalled();
  });

  it('12 — clicking toggle switch emits toggleStatus with user.id', () => {
    component.users = [mockUsers[0]];
    fixture.detectChanges();
    const spy = jest.fn();
    component.toggleStatus.subscribe(spy);

    const toggle = fixture.nativeElement.querySelector('input[type="checkbox"]');
    toggle.dispatchEvent(new Event('change'));

    expect(spy).toHaveBeenCalledWith(mockUsers[0].id);
  });
});
