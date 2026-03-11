import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalesOrderCreateComponent } from './sales-order-create.component';

describe('SalesOrderCreateComponent', () => {
  let component: SalesOrderCreateComponent;
  let fixture: ComponentFixture<SalesOrderCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesOrderCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SalesOrderCreateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
