import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WarehousesStateService } from '../../services/warehouses-state.service';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './warehouse-list.component.html',
  styleUrl: './warehouse-list.component.scss',
})
export class WarehouseListComponent implements OnInit {
  private router = inject(Router);
  protected state = inject(WarehousesStateService);

  ngOnInit() {
    this.state.loadWarehouses();
  }

  onSearch(term: string) {
    this.state.setSearchTerm(term);
  }

  clearFilters() {
    this.state.reset();
    this.state.loadWarehouses();
  }

  onFilterActive(isActive: boolean | null) {
    this.state.setActiveFilter(isActive);
  }

  onFilterPrimary(isPrimary: boolean | null) {
    this.state.setPrimaryFilter(isPrimary);
  }

  onPageChange(page: number) {
    this.state.setPage(page);
  }

  onCreate() {
    this.router.navigate(['/wms/warehouses/new']);
  }

  onEdit(id: number) {
    this.router.navigate(['/wms/warehouses', id, 'edit']);
  }

  onDelete(id: number) {
    if (confirm('¿Está seguro de eliminar este almacén?')) {
      this.state.deleteWarehouse(id);
    }
  }
}
