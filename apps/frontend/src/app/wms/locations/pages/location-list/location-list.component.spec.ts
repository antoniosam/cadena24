import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocationListComponent } from './location-list.component';
import { LocationsStateService } from '../../services/locations-state.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

describe('LocationListComponent', () => {
  let component: LocationListComponent;
  let fixture: ComponentFixture<LocationListComponent>;
  let mockStateService: any;
  let mockRouter: jest.Mocked<Router>;

  beforeEach(async () => {
    mockStateService = {
      locations: signal([]),
      loading: signal(false),
      error: signal(null),
      hasLocations: signal(false),
      hasError: signal(false),
      searchTerm: signal(''),
      typeFilter: signal(null),
      availableOnlyFilter: signal(false),
      currentPage: signal(1),
      totalPages: signal(1),
      loadLocations: jest.fn(),
      setSearchTerm: jest.fn(),
      setTypeFilter: jest.fn(),
      setAvailableOnlyFilter: jest.fn(),
      setPage: jest.fn(),
      deleteLocation: jest.fn(),
    };

    mockRouter = {
      navigate: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [LocationListComponent],
      providers: [
        { provide: LocationsStateService, useValue: mockStateService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load locations on init', () => {
    component.ngOnInit();
    expect(mockStateService.loadLocations).toHaveBeenCalled();
  });

  it('should navigate to create form', () => {
    component.onCreate();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/wms/locations/new']);
  });

  it('should navigate to edit form', () => {
    component.onEdit(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/wms/locations', 1, 'edit']);
  });

  it('should return correct type labels', () => {
    expect(component.getTypeLabel('receiving')).toBe('Recepción');
    expect(component.getTypeLabel('storage')).toBe('Almacenamiento');
    expect(component.getTypeLabel('picking')).toBe('Picking');
    expect(component.getTypeLabel('shipping')).toBe('Despacho');
  });
});
