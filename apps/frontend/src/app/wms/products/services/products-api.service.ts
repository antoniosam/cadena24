import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductsResponse, CreateProductDto } from '@cadena24-wms/shared';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wms/products`;

  getProducts(filters?: {
    search?: string;
    category?: string;
    isActive?: boolean;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  }): Observable<ProductsResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ProductsResponse>(this.apiUrl, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  findByBarcode(barcode: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/search/barcode/${barcode}`);
  }

  createProduct(data: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, data);
  }

  updateProduct(id: number, data: Partial<CreateProductDto>): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}`, data);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addBarcode(
    productId: number,
    barcode: string,
    type: string,
    isPrimary: boolean = false
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/${productId}/barcodes`, {
      barcode,
      type,
      isPrimary,
    });
  }

  removeBarcode(productId: number, barcodeId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${productId}/barcodes/${barcodeId}`);
  }

  getLowStockProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/low-stock`);
  }
}
