import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SalesOrdersStateService } from '../../services/sales-orders-state.service';
import { SalesOrderStatus, SalesOrderPriority } from '@cadena24-wms/shared';

@Component({
  selector: 'app-sales-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-order-list.component.html',
  styleUrl: './sales-order-list.component.scss',
})
export class SalesOrderListComponent implements OnInit {
  private router = inject(Router);
  protected state = inject(SalesOrdersStateService);

  customerSearch = '';

  readonly statusOptions: { value: SalesOrderStatus | ''; label: string }[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'picking', label: 'En Picking' },
    { value: 'picked', label: 'Surtido' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  readonly priorityOptions: { value: SalesOrderPriority | ''; label: string }[] = [
    { value: '', label: 'Todas las prioridades' },
    { value: 'urgent', label: 'Urgente' },
    { value: 'high', label: 'Alta' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Baja' },
  ];

  ngOnInit() {
    this.state.loadSalesOrders();
  }

  onFilterStatus(event: Event) {
    const value = (event.target as HTMLSelectElement).value as SalesOrderStatus | '';
    this.state.setStatusFilter(value || null);
  }

  onFilterPriority(event: Event) {
    const value = (event.target as HTMLSelectElement).value as SalesOrderPriority | '';
    this.state.setPriorityFilter(value || null);
  }

  onSearchCustomer() {
    this.state.setCustomerNameFilter(this.customerSearch || null);
  }

  onPageChange(page: number) {
    this.state.setPage(page);
  }

  onCreate() {
    this.router.navigate(['/wms/sales-orders/new']);
  }

  onView(id: number) {
    this.router.navigate(['/wms/sales-orders', id]);
  }

  onCancel(id: number, orderNumber: string, event: Event) {
    event.stopPropagation();
    if (
      confirm(
        `¿Está seguro de cancelar la orden ${orderNumber}? Esta acción liberará el inventario reservado.`
      )
    ) {
      this.state.cancelSalesOrder(id, () => {
        this.state.loadSalesOrders();
      });
    }
  }

  onChangePriority(id: number, priority: SalesOrderPriority, event: Event) {
    event.stopPropagation();
    this.state.updatePriority(id, priority);
  }

  clearFilters() {
    this.customerSearch = '';
    this.state.clearFilters();
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'badge-pending',
      picking: 'badge-picking',
      picked: 'badge-picked',
      shipped: 'badge-shipped',
      cancelled: 'badge-cancelled',
    };
    return classes[status] || 'badge-priority-normal';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      picking: 'En Picking',
      picked: 'Surtido',
      shipped: 'Enviado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: Record<string, string> = {
      urgent: 'badge-priority-urgent',
      high: 'badge-priority-high',
      normal: 'badge-priority-normal',
      low: 'badge-priority-low',
    };
    return classes[priority] || 'badge-priority-normal';
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      urgent: 'Urgente',
      high: 'Alta',
      normal: 'Normal',
      low: 'Baja',
    };
    return labels[priority] || priority;
  }

  canCancel(status: string): boolean {
    return status !== 'shipped' && status !== 'cancelled';
  }

  get pages(): number[] {
    return Array.from({ length: this.state.totalPages() }, (_, i) => i + 1);
  }
}
