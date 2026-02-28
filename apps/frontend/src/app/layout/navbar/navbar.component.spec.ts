import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have app title', () => {
    expect(component.appTitle).toBe('Cadena24 WMS');
  });

  it('should toggle menu', () => {
    expect(component.isMenuCollapsed).toBe(true);
    component.toggleMenu();
    expect(component.isMenuCollapsed).toBe(false);
    component.toggleMenu();
    expect(component.isMenuCollapsed).toBe(true);
  });
});
