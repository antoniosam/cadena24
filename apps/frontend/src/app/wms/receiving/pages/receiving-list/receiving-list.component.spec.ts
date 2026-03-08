import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceivingListComponent } from './receiving-list.component';

describe('ReceivingListComponent', () => {
  let component: ReceivingListComponent;
  let fixture: ComponentFixture<ReceivingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceivingListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceivingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
