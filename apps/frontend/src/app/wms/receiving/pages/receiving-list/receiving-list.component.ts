import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReceivingStateService } from '../../services/receiving-state.service';

@Component({
  selector: 'app-receiving-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './receiving-list.component.html',
  styleUrl: './receiving-list.component.scss',
})
export class ReceivingListComponent implements OnInit {
  private router = inject(Router);
  protected state = inject(ReceivingStateService);

  ngOnInit() {
    this.state.loadReceivingOrders();
  }

  onFilterStatus(status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | null) {
    this.state.setStatusFilter(status);
  }

  onFilterWarehouse(warehouseId: number | null) {
    this.state.setWarehouseFilter(warehouseId);
  }

  onPageChange(page: number) {
    this.state.setPage(page);
  }

  onCreate() {
    this.router.navigate(['/wms/receiving/new']);
  }

  onView(id: number) {
    this.router.navigate(['/wms/receiving', id]);
  }

  onProcess(id: number) {
    this.router.navigate(['/wms/receiving', id, 'process']);
  }

  onCancel(id: number, orderNumber: string) {
    if (
      confirm(`¿Está seguro de cancelar la orden ${orderNumber}? Esta acción no se puede deshacer.`)
    ) {
      // Call API to cancel
      // Then reload
      this.state.loadReceivingOrders();
    }
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'badge-warning',
      in_progress: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger',
    };
    return classes[status] || 'badge-secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      in_progress: 'En Proceso',
      completed: 'Completado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  clearFilters() {
    this.state.clearFilters();
  }
}
