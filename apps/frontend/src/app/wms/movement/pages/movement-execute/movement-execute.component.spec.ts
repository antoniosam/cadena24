import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovementExecuteComponent } from './movement-execute.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('MovementExecuteComponent', () => {
  let component: MovementExecuteComponent;
  let fixture: ComponentFixture<MovementExecuteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovementExecuteComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MovementExecuteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct status labels', () => {
    expect(component.getStatusLabel('pending')).toBe('Pendiente');
    expect(component.getStatusLabel('in_progress')).toBe('En Proceso');
    expect(component.getStatusLabel('completed')).toBe('Completado');
  });

  it('should return correct type labels', () => {
    expect(component.getTypeLabel('PUTAWAY')).toBe('Guardado');
    expect(component.getTypeLabel('CONSOLIDATION')).toBe('Consolidación');
  });
});
