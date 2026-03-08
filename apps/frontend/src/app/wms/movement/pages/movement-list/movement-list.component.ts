import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MovementStateService } from '../../services/movement-state.service';
import { MovementStatus, MovementType } from '@cadena24-wms/shared';

@Component({
  selector: 'app-movement-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movement-list.component.html',
  styleUrl: './movement-list.component.scss',
})
export class MovementListComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly state = inject(MovementStateService);

  ngOnInit() {
    this.state.loadMovementOrders();
  }

  onCreate() {
    this.router.navigate(['/wms/movement/new']);
  }

  onView(id: number) {
    this.router.navigate(['/wms/movement', id]);
  }

  onExecute(id: number) {
    this.router.navigate(['/wms/movement', id, 'execute']);
  }

  onCancel(id: number, orderNumber: string) {
    if (confirm(`¿Cancelar la orden ${orderNumber}? Esta acción no se puede deshacer.`)) {
      this.state.cancelOrder(id);
    }
  }

  onFilterStatus(status: MovementStatus | null) {
    this.state.setStatusFilter(status);
  }

  onFilterType(type: MovementType | null) {
    this.state.setTypeFilter(type);
  }

  onPageChange(page: number) {
    this.state.setPage(page);
  }

  clearFilters() {
    this.state.clearFilters();
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'badge-warning',
      in_progress: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger',
    };
    return classes[status] ?? 'badge-secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      in_progress: 'En Proceso',
      completed: 'Completado',
      cancelled: 'Cancelado',
    };
    return labels[status] ?? status;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      PUTAWAY: 'Guardado',
      REPLENISHMENT: 'Reabastecimiento',
      CONSOLIDATION: 'Consolidación',
      RELOCATION: 'Reubicación',
    };
    return labels[type] ?? type;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      PUTAWAY: 'bi-box-arrow-in-down',
      REPLENISHMENT: 'bi-arrow-repeat',
      CONSOLIDATION: 'bi-arrows-collapse',
      RELOCATION: 'bi-arrow-left-right',
    };
    return icons[type] ?? 'bi-arrows-move';
  }
}
