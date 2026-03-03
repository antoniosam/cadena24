import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { UsersStateService } from './users.state.service';
import { UsersService } from './users.service';
import { IUser, IUserSummary } from '@cadena24-wms/shared';

const mockUserSummary: IUserSummary = {
  id: 1,
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'USER' as never,
  active: true,
};

const mockUser: IUser = {
  id: 1,
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  birthday: null,
  role: 'USER' as never,
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('UsersStateService', () => {
  let service: UsersStateService;
  let mockUsersService: jest.Mocked<Partial<UsersService>>;

  // Subjects to control observable emissions in tests
  let getAllSubject: Subject<unknown>;
  let getByIdSubject: Subject<unknown>;
  let createSubject: Subject<unknown>;
  let updateSubject: Subject<unknown>;
  let toggleSubject: Subject<unknown>;
  let deleteSubject: Subject<unknown>;
  let passwordSubject: Subject<unknown>;

  beforeEach(() => {
    getAllSubject = new Subject();
    getByIdSubject = new Subject();
    createSubject = new Subject();
    updateSubject = new Subject();
    toggleSubject = new Subject();
    deleteSubject = new Subject();
    passwordSubject = new Subject();

    mockUsersService = {
      getAll: jest.fn().mockReturnValue(getAllSubject.asObservable()),
      getById: jest.fn().mockReturnValue(getByIdSubject.asObservable()),
      create: jest.fn().mockReturnValue(createSubject.asObservable()),
      update: jest.fn().mockReturnValue(updateSubject.asObservable()),
      toggleStatus: jest.fn().mockReturnValue(toggleSubject.asObservable()),
      delete: jest.fn().mockReturnValue(deleteSubject.asObservable()),
      changePassword: jest.fn().mockReturnValue(passwordSubject.asObservable()),
    };

    TestBed.configureTestingModule({
      providers: [UsersStateService, { provide: UsersService, useValue: mockUsersService }],
    });

    service = TestBed.inject(UsersStateService);
  });

  // ── Initial signal values ──────────────────────────────────────────────────

  it('1 — users() is [] on creation', () => {
    expect(service.users()).toEqual([]);
  });

  it('2 — loading() is false on creation', () => {
    expect(service.loading()).toBe(false);
  });

  it('3 — saving() is false on creation', () => {
    expect(service.saving()).toBe(false);
  });

  it('4 — error() is null on creation', () => {
    expect(service.error()).toBeNull();
  });

  it('5 — selectedUser() is null on creation', () => {
    expect(service.selectedUser()).toBeNull();
  });

  it('6 — passwordModalOpen() is false on creation', () => {
    expect(service.passwordModalOpen()).toBe(false);
  });

  it('7 — passwordModalUserId() is null on creation', () => {
    expect(service.passwordModalUserId()).toBeNull();
  });

  // ── Computed signals ───────────────────────────────────────────────────────

  it('8 — activeUsers() filters out inactive users', () => {
    const inactive = { ...mockUserSummary, id: 2, active: false };
    service.users.set([mockUserSummary, inactive]);
    expect(service.activeUsers()).toHaveLength(1);
    expect(service.activeUsers()[0].active).toBe(true);
  });

  it('9 — inactiveUsers() filters out active users', () => {
    const inactive = { ...mockUserSummary, id: 2, active: false };
    service.users.set([mockUserSummary, inactive]);
    expect(service.inactiveUsers()).toHaveLength(1);
    expect(service.inactiveUsers()[0].active).toBe(false);
  });

  it('10 — totalUsers() returns 0 when pagination() is null', () => {
    expect(service.totalUsers()).toBe(0);
  });

  it('11 — totalUsers() returns pagination.total when set', () => {
    service.pagination.set({
      page: 1,
      limit: 10,
      total: 42,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: false,
    });
    expect(service.totalUsers()).toBe(42);
  });

  it('12 — hasNextPage() returns true when pagination.hasNextPage is true', () => {
    service.pagination.set({
      page: 1,
      limit: 10,
      total: 20,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    });
    expect(service.hasNextPage()).toBe(true);
  });

  // ── loadUsers() ────────────────────────────────────────────────────────────

  it('13 — loadUsers() sets loading to true before HTTP resolves', () => {
    service.loadUsers();
    expect(service.loading()).toBe(true);
  });

  it('14 — loadUsers() sets loading to false after HTTP success', () => {
    service.loadUsers();
    getAllSubject.next({
      success: true,
      data: [mockUserSummary],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(service.loading()).toBe(false);
  });

  it('15 — loadUsers() populates users signal with response data', () => {
    service.loadUsers();
    getAllSubject.next({
      success: true,
      data: [mockUserSummary],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(service.users()).toEqual([mockUserSummary]);
  });

  it('16 — loadUsers() sets pagination signal from response', () => {
    service.loadUsers();
    getAllSubject.next({
      success: true,
      data: [],
      pagination: { page: 2, limit: 5, total: 10, totalPages: 2 },
    });
    expect(service.pagination()?.page).toBe(2);
    expect(service.pagination()?.total).toBe(10);
  });

  it('17 — loadUsers() sets error signal when HTTP fails', () => {
    service.loadUsers();
    getAllSubject.error({ error: { message: 'Error al cargar los usuarios' } });
    expect(service.error()).toBe('Error al cargar los usuarios');
  });

  it('18 — loadUsers() sets loading to false after HTTP error', () => {
    service.loadUsers();
    getAllSubject.error({ error: { message: 'Server error' } });
    expect(service.loading()).toBe(false);
  });

  // ── toggleUserStatus() ────────────────────────────────────────────────────

  it('19 — toggleUserStatus() updates active in-place after success', () => {
    service.users.set([mockUserSummary]);
    service.toggleUserStatus(1);
    toggleSubject.next({ success: true, data: { ...mockUser, active: false } });
    expect(service.users()[0].active).toBe(false);
  });

  it('20 — toggleUserStatus() sets error when HTTP fails', () => {
    service.toggleUserStatus(1);
    toggleSubject.error({ error: { message: 'Error al cambiar el estado del usuario' } });
    expect(service.error()).toBe('Error al cambiar el estado del usuario');
  });

  // ── createUser() ───────────────────────────────────────────────────────────

  it('21 — createUser() appends new user summary to users array', () => {
    service.users.set([]);
    const dto = { email: 'new@example.com', firstName: 'New', lastName: 'User', password: 'Pass1' };
    service.createUser(dto);
    createSubject.next({ success: true, data: mockUser });
    expect(service.users()).toHaveLength(1);
  });

  it('22 — createUser() sets saving true then false', () => {
    const dto = { email: 'new@example.com', firstName: 'New', lastName: 'User', password: 'Pass1' };
    service.createUser(dto);
    expect(service.saving()).toBe(true);
    createSubject.next({ success: true, data: mockUser });
    expect(service.saving()).toBe(false);
  });

  it('23 — createUser() calls onSuccess callback on success', () => {
    const onSuccess = jest.fn();
    const dto = { email: 'new@example.com', firstName: 'New', lastName: 'User', password: 'Pass1' };
    service.createUser(dto, onSuccess);
    createSubject.next({ success: true, data: mockUser });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  // ── updateUser() ───────────────────────────────────────────────────────────

  it('24 — updateUser() updates user in-place in users array', () => {
    service.users.set([mockUserSummary]);
    service.updateUser(1, { firstName: 'Updated' });
    updateSubject.next({ success: true, data: { ...mockUser, firstName: 'Updated' } });
    expect(service.users()[0].firstName).toBe('Updated');
  });

  // ── Password modal actions ─────────────────────────────────────────────────

  it('25 — openPasswordModal(5) sets passwordModalOpen=true and passwordModalUserId=5', () => {
    service.openPasswordModal(5);
    expect(service.passwordModalOpen()).toBe(true);
    expect(service.passwordModalUserId()).toBe(5);
  });

  it('26 — closePasswordModal() clears passwordModalOpen and passwordModalUserId', () => {
    service.openPasswordModal(5);
    service.closePasswordModal();
    expect(service.passwordModalOpen()).toBe(false);
    expect(service.passwordModalUserId()).toBeNull();
  });

  it('27 — changePassword() does nothing if passwordModalUserId is null', () => {
    service.changePassword({ currentPassword: 'a', newPassword: 'b', confirmPassword: 'b' });
    expect(mockUsersService.changePassword).not.toHaveBeenCalled();
  });

  it('28 — changePassword() sets passwordSaving true then false on success', () => {
    service.openPasswordModal(1);
    service.changePassword({
      currentPassword: 'a',
      newPassword: 'New1234',
      confirmPassword: 'New1234',
    });
    expect(service.passwordSaving()).toBe(true);
    passwordSubject.next({ success: true, data: null });
    expect(service.passwordSaving()).toBe(false);
  });

  it('29 — changePassword() calls closePasswordModal() on success', () => {
    service.openPasswordModal(1);
    service.changePassword({
      currentPassword: 'a',
      newPassword: 'New1234',
      confirmPassword: 'New1234',
    });
    passwordSubject.next({ success: true, data: null });
    expect(service.passwordModalOpen()).toBe(false);
    expect(service.passwordModalUserId()).toBeNull();
  });

  it('30 — changePassword() sets passwordError on HTTP failure', () => {
    service.openPasswordModal(1);
    service.changePassword({
      currentPassword: 'wrong',
      newPassword: 'New1234',
      confirmPassword: 'New1234',
    });
    passwordSubject.error({ error: { message: 'La contraseña actual es incorrecta' } });
    expect(service.passwordError()).toBe('La contraseña actual es incorrecta');
  });

  // ── Utilities ──────────────────────────────────────────────────────────────

  it('31 — clearError() resets error to null', () => {
    service.error.set('Some error');
    service.clearError();
    expect(service.error()).toBeNull();
  });

  it('32 — clearSuccess() resets successMsg to null', () => {
    service.successMsg.set('Success!');
    service.clearSuccess();
    expect(service.successMsg()).toBeNull();
  });

  it('33 — clearSelected() resets selectedUser to null', () => {
    service.selectedUser.set(mockUser);
    service.clearSelected();
    expect(service.selectedUser()).toBeNull();
  });
});
