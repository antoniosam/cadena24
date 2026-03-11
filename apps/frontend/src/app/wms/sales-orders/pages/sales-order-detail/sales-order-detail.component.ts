import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SalesOrdersStateService } from '../../services/sales-orders-state.service';
import { SalesOrderPriority } from '@cadena24-wms/shared';

@Component({
  selector: 'app-sales-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-order-detail.component.html',
  styleUrl: './sales-order-detail.component.scss',
})
export class SalesOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected state = inject(SalesOrdersStateService);

  readonly priorityOptions: { value: SalesOrderPriority; label: string }[] = [
    { value: 'low', label: 'Baja' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.state.loadSalesOrder(id);
    }
  }

  onBack(): void {
    this.router.navigate(['/wms/sales-orders']);
  }

  onChangePriority(event: Event): void {
    const order = this.state.selectedOrder();
    if (!order) return;
    const priority = (event.target as HTMLSelectElement).value as SalesOrderPriority;
    this.state.updatePriority(order.id, priority);
  }

  onCancel(): void {
    const order = this.state.selectedOrder();
    if (!order) return;
    if (
      confirm(
        `¿Está seguro de cancelar la orden ${order.orderNumber}? Se liberará el inventario reservado.`
      )
    ) {
      this.state.cancelSalesOrder(order.id, () => {
        this.state.loadSalesOrder(order.id);
      });
    }
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

  getLineStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      picking: 'En Picking',
      picked: 'Surtido',
      shipped: 'Enviado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  canCancel(): boolean {
    const status = this.state.selectedOrder()?.status;
    return status !== 'shipped' && status !== 'cancelled';
  }

  canChangePriority(): boolean {
    const status = this.state.selectedOrder()?.status;
    return status !== 'shipped' && status !== 'cancelled';
  }
}
