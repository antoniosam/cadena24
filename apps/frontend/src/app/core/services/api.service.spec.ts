import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { ApiResponse } from '@cadena24-wms/shared';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch health status', () => {
    const mockResponse: ApiResponse<{ status: string; version: string }> = {
      success: true,
      message: 'API is running',
      data: { status: 'healthy', version: '1.0.0' },
      timestamp: new Date().toISOString(),
    };

    service.getHealth().subscribe((response) => {
      expect(response.success).toBe(true);
      expect(response.data?.status).toBe('healthy');
    });

    const req = httpMock.expectOne('/api');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
