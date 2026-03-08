import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceivingProcessComponent } from './receiving-process.component';

describe('ReceivingProcessComponent', () => {
  let component: ReceivingProcessComponent;
  let fixture: ComponentFixture<ReceivingProcessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceivingProcessComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceivingProcessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
