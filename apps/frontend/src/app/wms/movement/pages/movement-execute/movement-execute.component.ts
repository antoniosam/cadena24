import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MovementStateService } from '../../services/movement-state.service';
import { MovementOrderLine } from '@cadena24-wms/shared';

@Component({
  selector: 'app-movement-execute',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movement-execute.component.html',
  styleUrl: './movement-execute.component.scss',
})
export class MovementExecuteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly state = inject(MovementStateService);

  // Selected line for execution
  selectedLine = signal<MovementOrderLine | null>(null);
  movedQuantity = signal<number>(0);
  processing = signal<boolean>(false);
  successMessage = signal<string | null>(null);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.state.loadMovementOrder(id);
    }
  }

  get orderId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  startExecution() {
    const order = this.state.selectedOrder();
    if (!order) return;

    this.state.startExecution(
      order.id,
      () => {
        this.successMessage.set('Orden iniciada. Ahora puede ejecutar las líneas.');
      },
      (msg) => alert('Error al iniciar orden: ' + msg)
    );
  }

  selectLine(line: MovementOrderLine) {
    if (line.status === 'completed') return;
    this.selectedLine.set(line);
    this.movedQuantity.set(line.quantity);
    this.successMessage.set(null);
  }

  executeLine() {
    const line = this.selectedLine();
    if (!line) return;

    const qty = this.movedQuantity();
    if (qty <= 0) {
      alert('La cantidad a mover debe ser mayor a 0');
      return;
    }

    if (qty > line.quantity) {
      alert(`La cantidad no puede superar la cantidad planificada (${line.quantity})`);
      return;
    }

    if (!confirm(`¿Confirmar movimiento de ${qty} unidades de "${line.product?.name}"?`)) {
      return;
    }

    this.processing.set(true);

    this.state.executeLine(
      this.orderId,
      { lineId: line.id, movedQuantity: qty },
      () => {
        this.successMessage.set(
          `Línea ejecutada: ${qty} unidades de "${line.product?.name}" movidas correctamente`
        );
        this.selectedLine.set(null);
        this.movedQuantity.set(0);
        this.processing.set(false);
      },
      (msg) => {
        alert('Error al ejecutar línea: ' + msg);
        this.processing.set(false);
      }
    );
  }

  completeOrder() {
    const order = this.state.selectedOrder();
    if (!order) return;

    if (this.state.hasPendingLines()) {
      alert('Debe ejecutar todas las líneas antes de completar la orden');
      return;
    }

    if (!confirm('¿Completar esta orden de movimiento?')) return;

    this.state.completeOrder(
      order.id,
      () => {
        alert('Orden completada correctamente');
        this.router.navigate(['/wms/movement']);
      },
      (msg) => alert('Error al completar orden: ' + msg)
    );
  }

  goBack() {
    this.router.navigate(['/wms/movement']);
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
}
