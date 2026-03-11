import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalesOrderDetailComponent } from './sales-order-detail.component';

describe('SalesOrderDetailComponent', () => {
  let component: SalesOrderDetailComponent;
  let fixture: ComponentFixture<SalesOrderDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesOrderDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SalesOrderDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
