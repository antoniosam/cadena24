import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { UsersPageComponent } from './users-page.component';
import { UsersStateService } from './services/users.state.service';
import { IUser, IUserSummary, RoleCode } from '@cadena24-wms/shared';

const mockUserSummary: IUserSummary = {
  id: 1,
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: RoleCode.USER,
  active: true,
};

const mockUser: IUser = {
  id: 1,
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  birthday: null,
  role: RoleCode.USER,
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const createMockStateService = () => ({
  users: signal<IUserSummary[]>([mockUserSummary]),
  selectedUser: signal<IUser | null>(null),
  loading: signal(false),
  saving: signal(false),
  error: signal<string | null>(null),
  successMsg: signal<string | null>(null),
  pagination: signal(null),
  passwordModalOpen: signal(false),
  passwordModalUserId: signal<number | null>(null),
  passwordSaving: signal(false),
  passwordError: signal<string | null>(null),
  activeUsers: signal<IUserSummary[]>([]),
  inactiveUsers: signal<IUserSummary[]>([]),
  totalUsers: signal(0),
  hasNextPage: signal(false),
  hasPrevPage: signal(false),
  loadUsers: jest.fn(),
  loadUser: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  toggleUserStatus: jest.fn(),
  deleteUser: jest.fn(),
  openPasswordModal: jest.fn(),
  closePasswordModal: jest.fn(),
  changePassword: jest.fn(),
  clearError: jest.fn(),
  clearSuccess: jest.fn(),
  clearSelected: jest.fn(),
});

describe('UsersPageComponent', () => {
  let component: UsersPageComponent;
  let fixture: ComponentFixture<UsersPageComponent>;
  let mockState: ReturnType<typeof createMockStateService>;

  beforeEach(async () => {
    mockState = createMockStateService();

    await TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: [{ provide: UsersStateService, useValue: mockState }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPageComponent);
    component = fixture.componentInstance;
  });

  // ── Initialization ─────────────────────────────────────────────────────────

  it('1 — calls state.loadUsers() on ngOnInit', () => {
    fixture.detectChanges();
    expect(mockState.loadUsers).toHaveBeenCalledTimes(1);
  });

  it('2 — initial mode signal is "list"', () => {
    fixture.detectChanges();
    expect(component.mode()).toBe('list');
  });

  // ── Mode switching ─────────────────────────────────────────────────────────

  it('3 — showCreate() sets mode to "create" and calls clearSelected()', () => {
    fixture.detectChanges();
    component.showCreate();
    expect(component.mode()).toBe('create');
    expect(mockState.clearSelected).toHaveBeenCalled();
  });

  it('4 — showEdit(user) sets mode to "edit" and calls state.loadUser(user.id)', () => {
    fixture.detectChanges();
    component.showEdit(mockUserSummary);
    expect(component.mode()).toBe('edit');
    expect(mockState.loadUser).toHaveBeenCalledWith(mockUserSummary.id);
  });

  it('5 — showList() sets mode back to "list"', () => {
    fixture.detectChanges();
    component.mode.set('edit');
    component.showList();
    expect(component.mode()).toBe('list');
  });

  // ── Template rendering by mode ────────────────────────────────────────────

  it('6 — "Nuevo Usuario" button visible in list mode', () => {
    mockState.loading.set(false);
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Nuevo Usuario');
  });

  it('7 — "Nuevo Usuario" button NOT visible in create mode', () => {
    fixture.detectChanges();
    component.mode.set('create');
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    // The button with "Nuevo Usuario" should not be visible
    const buttons = fixture.nativeElement.querySelectorAll('button.btn-primary');
    const newUserBtn = Array.from(buttons as NodeListOf<HTMLButtonElement>).find((b) =>
      b.textContent?.includes('Nuevo Usuario')
    );
    expect(newUserBtn).toBeFalsy();
  });

  it('8 — app-user-list rendered when mode is "list" and not loading', () => {
    mockState.loading.set(false);
    fixture.detectChanges();
    const list = fixture.nativeElement.querySelector('app-user-list');
    expect(list).toBeTruthy();
  });

  it('9 — loading spinner shown when state.loading() is true in list mode', () => {
    mockState.loading.set(true);
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('.spinner-border');
    expect(spinner).toBeTruthy();
  });

  it('10 — app-user-form rendered when mode is "create"', () => {
    fixture.detectChanges();
    component.mode.set('create');
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('app-user-form');
    expect(form).toBeTruthy();
  });

  it('11 — app-user-form rendered when mode is "edit" and selectedUser is loaded', () => {
    mockState.selectedUser.set(mockUser);
    mockState.loading.set(false);
    fixture.detectChanges();
    component.mode.set('edit');
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('app-user-form');
    expect(form).toBeTruthy();
  });

  it('12 — app-password-modal always present in DOM regardless of mode', () => {
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('app-password-modal');
    expect(modal).toBeTruthy();
    component.mode.set('create');
    fixture.detectChanges();
    const modalAfter = fixture.nativeElement.querySelector('app-password-modal');
    expect(modalAfter).toBeTruthy();
  });
});
