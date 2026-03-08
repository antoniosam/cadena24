import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovementCreateComponent } from './movement-create.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('MovementCreateComponent', () => {
  let component: MovementCreateComponent;
  let fixture: ComponentFixture<MovementCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovementCreateComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MovementCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have movementType defaulted to PUTAWAY', () => {
    expect(component.form.get('movementType')?.value).toBe('PUTAWAY');
  });

  it('should start with one line', () => {
    expect(component.lines.length).toBe(1);
  });

  it('should add and remove lines', () => {
    component.addLine();
    expect(component.lines.length).toBe(2);
    component.removeLine(0);
    expect(component.lines.length).toBe(1);
  });
});
