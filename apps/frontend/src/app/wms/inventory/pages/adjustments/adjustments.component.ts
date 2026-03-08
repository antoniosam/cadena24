import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryStateService } from '../../services/inventory-state.service';

@Component({
  selector: 'app-adjustments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adjustments.component.html',
  styleUrl: './adjustments.component.scss',
})
export class AdjustmentsComponent implements OnInit {
  protected state = inject(InventoryStateService);

  ngOnInit() {
    this.state.loadAdjustments();
  }

  onApprove(id: string) {
    this.state.approveAdjustment(id, () => {
      this.state.loadAdjustments();
    });
  }

  onCancel(id: string) {
    this.state.cancelAdjustment(id, () => {
      this.state.loadAdjustments();
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      approved: 'Aprobado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      draft: 'badge-warning',
      approved: 'badge-success',
      cancelled: 'badge-secondary',
    };
    return classes[status] || '';
  }

  getReasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      PHYSICAL_COUNT: 'Conteo Físico',
      DAMAGE: 'Daño',
      FOUND: 'Encontrado',
      LOST: 'Pérdida',
      CORRECTION: 'Corrección',
    };
    return labels[reason] || reason;
  }
}
