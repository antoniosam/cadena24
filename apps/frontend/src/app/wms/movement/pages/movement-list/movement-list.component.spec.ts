import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovementListComponent } from './movement-list.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('MovementListComponent', () => {
  let component: MovementListComponent;
  let fixture: ComponentFixture<MovementListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovementListComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MovementListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct status label', () => {
    expect(component.getStatusLabel('pending')).toBe('Pendiente');
    expect(component.getStatusLabel('in_progress')).toBe('En Proceso');
    expect(component.getStatusLabel('completed')).toBe('Completado');
    expect(component.getStatusLabel('cancelled')).toBe('Cancelado');
  });

  it('should return correct type label', () => {
    expect(component.getTypeLabel('PUTAWAY')).toBe('Guardado');
    expect(component.getTypeLabel('REPLENISHMENT')).toBe('Reabastecimiento');
    expect(component.getTypeLabel('CONSOLIDATION')).toBe('Consolidación');
    expect(component.getTypeLabel('RELOCATION')).toBe('Reubicación');
  });
});
