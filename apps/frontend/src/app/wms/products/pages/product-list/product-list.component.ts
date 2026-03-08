import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductsStateService } from '../../services/products-state.service';
import type { Product } from '@cadena24-wms/shared';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  private router = inject(Router);
  protected state = inject(ProductsStateService);

  ngOnInit() {
    this.state.loadProducts();
  }

  onSearch(term: string) {
    this.state.setSearchTerm(term);
  }

  onFilterLowStock(lowStock: boolean) {
    this.state.setLowStockFilter(lowStock);
  }

  onPageChange(page: number) {
    this.state.setPage(page);
  }

  onCreate() {
    this.router.navigate(['/wms/products/new']);
  }

  onEdit(id: number) {
    this.router.navigate(['/wms/products', id, 'edit']);
  }

  onDelete(id: number) {
    if (confirm('¿Está seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      this.state.deleteProduct(id);
    }
  }

  onToggleActive(id: number, currentValue: boolean) {
    this.state.toggleActive(id, !currentValue);
  }

  getBarcode(product: Product): string {
    return product.barcodes && product.barcodes.length > 0 ? product.barcodes[0].barcode : '—';
  }
}
