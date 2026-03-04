import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { TopbarComponent } from './topbar';
import { AuthStateService } from '../../pages/login/services/auth-state.service';
import { RoleCode } from '@cadena24-wms/shared';

describe('TopbarComponent', () => {
  let component: TopbarComponent;
  let fixture: ComponentFixture<TopbarComponent>;
  let mockAuthState: {
    userName: jest.Mock;
    userRole: jest.Mock;
    logout: jest.Mock;
    isAuthenticated: jest.Mock;
    currentUser: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    refreshing: ReturnType<typeof signal>;
  };
  let mockRouter: jest.Mocked<Router>;

  beforeEach(async () => {
    // Mock AuthStateService
    mockAuthState = {
      userName: jest.fn(() => 'John Doe'),
      userRole: jest.fn(() => RoleCode.ADMIN),
      logout: jest.fn(),
      isAuthenticated: jest.fn(() => true),
      currentUser: signal(null),
      loading: signal(false),
      error: signal(null),
      refreshing: signal(false),
    };

    // Mock Router
    mockRouter = {
      navigate: jest.fn(),
    } as unknown as jest.Mocked<Router>;

    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [
        { provide: AuthStateService, useValue: mockAuthState },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('1 — should create', () => {
    expect(component).toBeTruthy();
  });

  // ── getUserInitials() ──────────────────────────────────────────────────────

  it('2 — getUserInitials() returns initials from full name', () => {
    mockAuthState.userName.mockReturnValue('John Doe');
    expect(component.getUserInitials()).toBe('JD');
  });

  it('3 — getUserInitials() returns first letter for single name', () => {
    mockAuthState.userName.mockReturnValue('Admin');
    expect(component.getUserInitials()).toBe('A');
  });

  it('4 — getUserInitials() returns "?" when userName is null', () => {
    mockAuthState.userName.mockReturnValue(null);
    expect(component.getUserInitials()).toBe('?');
  });

  it('5 — getUserInitials() handles multiple spaces correctly', () => {
    mockAuthState.userName.mockReturnValue('María José García López');
    expect(component.getUserInitials()).toBe('ML'); // First and last
  });

  // ── getRoleLabel() ─────────────────────────────────────────────────────────

  it('6 — getRoleLabel() returns "Administrador" for ADMIN role', () => {
    mockAuthState.userRole.mockReturnValue(RoleCode.ADMIN);
    expect(component.getRoleLabel()).toBe('Administrador');
  });

  it('7 — getRoleLabel() returns "Usuario" for USER role', () => {
    mockAuthState.userRole.mockReturnValue(RoleCode.USER);
    expect(component.getRoleLabel()).toBe('Usuario');
  });

  it('8 — getRoleLabel() returns "Gerente" for MANAGER role', () => {
    mockAuthState.userRole.mockReturnValue(RoleCode.MANAGER);
    expect(component.getRoleLabel()).toBe('Gerente');
  });

  it('9 — getRoleLabel() returns "Usuario" when role is null', () => {
    mockAuthState.userRole.mockReturnValue(null);
    expect(component.getRoleLabel()).toBe('Usuario');
  });

  // ── toggleUserMenu() ───────────────────────────────────────────────────────

  it('10 — toggleUserMenu() changes isUserMenuOpen from false to true', () => {
    expect(component.isUserMenuOpen()).toBe(false);
    component.toggleUserMenu();
    expect(component.isUserMenuOpen()).toBe(true);
  });

  it('11 — toggleUserMenu() changes isUserMenuOpen from true to false', () => {
    component.isUserMenuOpen.set(true);
    component.toggleUserMenu();
    expect(component.isUserMenuOpen()).toBe(false);
  });

  // ── closeUserMenu() ────────────────────────────────────────────────────────

  it('12 — closeUserMenu() sets isUserMenuOpen to false', () => {
    component.isUserMenuOpen.set(true);
    component.closeUserMenu();
    expect(component.isUserMenuOpen()).toBe(false);
  });

  // ── onLogout() ─────────────────────────────────────────────────────────────

  it('13 — onLogout() calls authState.logout()', () => {
    component.onLogout();
    expect(mockAuthState.logout).toHaveBeenCalled();
  });

  it('14 — onLogout() closes user menu', () => {
    component.isUserMenuOpen.set(true);
    component.onLogout();
    expect(component.isUserMenuOpen()).toBe(false);
  });

  // ── onDocumentClick() ──────────────────────────────────────────────────────

  it('15 — onDocumentClick() closes menu when clicking outside', () => {
    component.isUserMenuOpen.set(true);
    const mockEvent = {
      target: document.createElement('div'),
    } as unknown as MouseEvent;

    component.onDocumentClick(mockEvent);
    expect(component.isUserMenuOpen()).toBe(false);
  });

  it('16 — onDocumentClick() keeps menu open when clicking inside user area', () => {
    component.isUserMenuOpen.set(true);

    const userArea = document.createElement('div');
    userArea.classList.add('topbar-user-area');
    const childElement = document.createElement('span');
    userArea.appendChild(childElement);

    const mockEvent = {
      target: childElement,
    } as unknown as MouseEvent;

    // Mock closest to return the user area
    jest.spyOn(childElement, 'closest').mockReturnValue(userArea);

    component.onDocumentClick(mockEvent);
    expect(component.isUserMenuOpen()).toBe(true);
  });
});
