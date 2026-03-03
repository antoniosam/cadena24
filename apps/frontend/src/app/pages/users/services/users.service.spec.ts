import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UsersService } from './users.service';
import {
  ICreateUser,
  IUpdateUser,
  IUser,
  IUserSummary,
  PaginatedApiResponse,
} from '@cadena24-wms/shared';

const BASE_URL = 'http://localhost:3000/api/users';

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

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsersService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── getAll() ───────────────────────────────────────────────────────────────

  it('1 — getAll() makes GET to /api/users without params', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
  });

  it('2 — getAll({ page: 2, limit: 5 }) includes page and limit params', () => {
    service.getAll({ page: 2, limit: 5 }).subscribe();
    const req = httpMock.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('5');
    req.flush({
      success: true,
      data: [],
      pagination: { page: 2, limit: 5, total: 0, totalPages: 0 },
    });
  });

  it('3 — getAll({ role: "ADMIN" }) includes role param', () => {
    service.getAll({ role: 'ADMIN' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.get('role')).toBe('ADMIN');
    req.flush({
      success: true,
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
  });

  it('4 — getAll() returns observable with paginated response shape', () => {
    const mockResponse = {
      success: true,
      data: [mockUserSummary],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    let result: PaginatedApiResponse<IUserSummary> | undefined;
    service.getAll().subscribe((r) => (result = r));
    httpMock.expectOne(BASE_URL).flush(mockResponse);
    expect(result).toEqual(mockResponse);
  });

  // ── getById() ──────────────────────────────────────────────────────────────

  it('5 — getById(42) makes GET to /api/users/42', () => {
    service.getById(42).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/42`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockUser });
  });

  it('6 — getById() returns ApiResponse<IUser> observable', () => {
    const mockResponse = { success: true, data: mockUser };
    let result: { success: boolean; data: IUser } | undefined;
    service.getById(1).subscribe((r) => (result = r as { success: boolean; data: IUser }));
    httpMock.expectOne(`${BASE_URL}/1`).flush(mockResponse);
    expect(result).toEqual(mockResponse);
  });

  // ── create() ───────────────────────────────────────────────────────────────

  it('7 — create() makes POST to /api/users', () => {
    const dto: ICreateUser = {
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      password: 'Pass1234',
    };
    service.create(dto).subscribe();
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: mockUser });
  });

  it('8 — create() sends the correct DTO in the request body', () => {
    const dto: ICreateUser = {
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      password: 'Pass1234',
    };
    service.create(dto).subscribe();
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.body).toEqual(dto);
    req.flush({ success: true, data: mockUser });
  });

  // ── update() ───────────────────────────────────────────────────────────────

  it('9 — update(42, dto) makes PATCH to /api/users/42', () => {
    const dto: IUpdateUser = { firstName: 'Updated' };
    service.update(42, dto).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/42`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ success: true, data: mockUser });
  });

  it('10 — update() sends only the fields provided in IUpdateUser', () => {
    const dto: IUpdateUser = { firstName: 'Updated' };
    service.update(42, dto).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/42`);
    expect(req.request.body).toEqual(dto);
    req.flush({ success: true, data: mockUser });
  });

  // ── toggleStatus() ─────────────────────────────────────────────────────────

  it('11 — toggleStatus(42) makes PATCH to /api/users/42/toggle-status', () => {
    service.toggleStatus(42).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/42/toggle-status`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ success: true, data: mockUser });
  });

  it('12 — toggleStatus() sends empty object as body', () => {
    service.toggleStatus(42).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/42/toggle-status`);
    expect(req.request.body).toEqual({});
    req.flush({ success: true, data: mockUser });
  });

  // ── changePassword() ───────────────────────────────────────────────────────

  it('13 — changePassword(42, dto) makes PATCH to /api/users/42/password', () => {
    const dto = { currentPassword: 'Old1', newPassword: 'New1234', confirmPassword: 'New1234' };
    service.changePassword(42, dto).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/42/password`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ success: true, data: null });
  });

  it('14 — changePassword() body has currentPassword, newPassword, confirmPassword', () => {
    const dto = { currentPassword: 'Old1', newPassword: 'New1234', confirmPassword: 'New1234' };
    service.changePassword(42, dto).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/42/password`);
    expect(req.request.body['currentPassword']).toBeDefined();
    expect(req.request.body['newPassword']).toBeDefined();
    expect(req.request.body['confirmPassword']).toBeDefined();
    req.flush({ success: true, data: null });
  });

  // ── delete() ───────────────────────────────────────────────────────────────

  it('15 — delete(42) makes DELETE to /api/users/42', () => {
    service.delete(42).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/42`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, data: null });
  });
});
