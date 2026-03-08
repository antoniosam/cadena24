import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceivingCreateComponent } from './receiving-create.component';

describe('ReceivingCreateComponent', () => {
  let component: ReceivingCreateComponent;
  let fixture: ComponentFixture<ReceivingCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceivingCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceivingCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
