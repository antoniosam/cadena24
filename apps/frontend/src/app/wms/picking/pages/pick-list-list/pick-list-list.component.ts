import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PickingStateService } from '../../services/picking-state.service';
import { PickingApiService } from '../../services/picking-api.service';
import { SalesOrdersApiService } from '../../../sales-orders/services/sales-orders-api.service';
import { PickListStatus, SalesOrder } from '@cadena24-wms/shared';

@Component({
  selector: 'app-pick-list-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pick-list-list.component.html',
  styleUrl: './pick-list-list.component.scss',
})
export class PickListListComponent implements OnInit {
  private router = inject(Router);
  private api = inject(PickingApiService);
  private salesOrdersApi = inject(SalesOrdersApiService);
  protected state = inject(PickingStateService);

  // Generate modal state
  showGenerateModal = false;
  selectedOrderId: number | null = null;
  pendingOrders: SalesOrder[] = [];
  loadingPendingOrders = false;
  generateNotes = '';
  generating = false;
  generateError: string | null = null;

  readonly statusOptions: { value: PickListStatus | ''; label: string }[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'completed', label: 'Completada' },
    { value: 'cancelled', label: 'Cancelada' },
  ];

  ngOnInit() {
    this.state.loadPickLists();
  }

  onFilterStatus(event: Event) {
    const value = (event.target as HTMLSelectElement).value as PickListStatus | '';
    this.state.setStatusFilter(value || null);
  }

  onPageChange(page: number) {
    this.state.setPage(page);
  }

  onView(id: number) {
    this.router.navigate(['/wms/picking', id]);
  }

  openGenerateModal() {
    this.showGenerateModal = true;
    this.selectedOrderId = null;
    this.generateNotes = '';
    this.generateError = null;
    this.loadPendingOrders();
  }

  loadPendingOrders() {
    this.loadingPendingOrders = true;
    this.salesOrdersApi.getSalesOrders({ status: 'pending' }).subscribe({
      next: (response) => {
        this.pendingOrders = response.items;
        this.loadingPendingOrders = false;
      },
      error: () => {
        this.generateError = 'Error al cargar las órdenes pendientes';
        this.loadingPendingOrders = false;
      },
    });
  }

  closeGenerateModal() {
    this.showGenerateModal = false;
    this.generateError = null;
  }

  onGenerate() {
    if (!this.selectedOrderId) {
      this.generateError = 'Selecciona una orden de venta';
      return;
    }

    this.generating = true;
    this.generateError = null;

    this.state.generatePickList(
      { salesOrderId: this.selectedOrderId, notes: this.generateNotes || undefined },
      (pickList) => {
        this.generating = false;
        this.closeGenerateModal();
        this.state.loadPickLists();
        this.router.navigate(['/wms/picking', pickList.id]);
      },
      (msg) => {
        this.generating = false;
        this.generateError = msg;
      }
    );
  }

  onCancel(id: number, pickListNumber: string, event: Event) {
    event.stopPropagation();
    if (
      confirm(
        `¿Cancelar la pick list ${pickListNumber}? La orden de venta regresará a estado "pending".`
      )
    ) {
      this.state.cancelPickList(id, () => {
        this.state.loadPickLists();
      });
    }
  }

  clearFilters() {
    this.state.clearFilters();
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'badge-pending',
      in_progress: 'badge-picking',
      completed: 'badge-completed',
      cancelled: 'badge-cancelled',
    };
    return classes[status] || 'badge-pending';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  }

  canCancel(status: string): boolean {
    return status !== 'completed' && status !== 'cancelled';
  }

  getProgressPercent(picked: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((picked / total) * 100);
  }

  getOrderDisplay(order: SalesOrder): string {
    return `${order.orderNumber} - ${order.customerName}`;
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      urgent: 'priority-urgent',
      high: 'priority-high',
      normal: 'priority-normal',
      low: 'priority-low',
    };
    return classes[priority] || 'priority-normal';
  }
}
