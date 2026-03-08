import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReceivingStateService } from '../../services/receiving-state.service';
import { ReceivingApiService } from '../../services/receiving-api.service';
import { Location, ReceivingOrderLine } from '@cadena24-wms/shared';

@Component({
  selector: 'app-receiving-process',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './receiving-process.component.html',
  styleUrl: './receiving-process.component.scss',
})
export class ReceivingProcessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected state = inject(ReceivingStateService);
  private api = inject(ReceivingApiService);

  // Route mode detection
  isViewOnly = signal<boolean>(false);

  // Barcode scanning
  barcodeInput = signal<string>('');
  scannedLine = signal<ReceivingOrderLine | null>(null);

  // Receiving form
  selectedLocation = signal<Location | null>(null);
  receivedQuantity = signal<number>(0);
  damageQuantity = signal<number>(0);
  notes = signal<string>('');

  processing = signal<boolean>(false);
  successMessage = signal<string | null>(null);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    // Check if this is the detail view (:id) or process view (:id/process)
    const isProcessRoute = this.route.snapshot.url.some((segment) => segment.path === 'process');

    // If not process route, this is just a detail view
    this.isViewOnly.set(!isProcessRoute);

    if (id) {
      this.state.loadReceivingOrder(id);
      this.state.loadReceivingLocations(id);

      // Only auto-start if this is the process route and order is pending
      if (isProcessRoute) {
        setTimeout(() => {
          const order = this.state.selectedOrder();
          if (order && order.status === 'pending') {
            this.startReceiving();
          }
        }, 500);
      }
    }
  }

  startReceiving() {
    const order = this.state.selectedOrder();
    if (!order) return;

    this.processing.set(true);
    this.api.startReceiving(order.id).subscribe({
      next: (updatedOrder) => {
        this.state.updateOrderInList(updatedOrder);
        this.processing.set(false);
      },
      error: (err) => {
        alert('Error al iniciar recepción: ' + (err.error?.message || err.message));
        this.processing.set(false);
      },
    });
  }

  onBarcodeInput(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    this.barcodeInput.set(input);

    // Auto-search when barcode is entered (e.g., after Enter key)
    if (input.length > 5) {
      this.searchProductByBarcode(input);
    }
  }

  onBarcodeKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      const barcode = this.barcodeInput();
      if (barcode) {
        this.searchProductByBarcode(barcode);
      }
    }
  }

  searchProductByBarcode(barcode: string) {
    const order = this.state.selectedOrder();
    if (!order || !order.lines) return;

    // Find line with matching product barcode
    const line = order.lines.find((l) => l.product?.barcodes?.some((b) => b.barcode === barcode));

    if (line) {
      this.scannedLine.set(line);
      this.receivedQuantity.set(line.expectedQuantity);
      this.damageQuantity.set(0);
      this.successMessage.set(`Producto encontrado: ${line.product?.name}`);
    } else {
      this.scannedLine.set(null);
      alert(`Producto con código de barras ${barcode} no encontrado en esta orden`);
    }
  }

  selectLocation(location: Location) {
    this.selectedLocation.set(location);
  }

  onReceiveLine() {
    const order = this.state.selectedOrder();
    const line = this.scannedLine();
    const location = this.selectedLocation();

    if (!order || !line || !location) {
      alert('Debe escanear un producto y seleccionar una ubicación');
      return;
    }

    const receivedQty = this.receivedQuantity();
    const damageQty = this.damageQuantity();

    if (receivedQty <= 0) {
      alert('La cantidad recibida debe ser mayor a 0');
      return;
    }

    if (damageQty > receivedQty) {
      alert('La cantidad dañada no puede ser mayor a la cantidad recibida');
      return;
    }

    this.processing.set(true);

    this.api
      .receiveLine(order.id, {
        lineId: line.id,
        receivedQuantity: receivedQty,
        damageQuantity: damageQty,
        locationId: location.id,
        notes: this.notes(),
      })
      .subscribe({
        next: (updatedLine) => {
          this.state.updateLineInOrder(updatedLine);
          this.successMessage.set(
            `Línea recibida correctamente: ${receivedQty - damageQty} unidades buenas`
          );
          this.resetForm();
          this.processing.set(false);
        },
        error: (err) => {
          alert('Error al recibir línea: ' + (err.error?.message || err.message));
          this.processing.set(false);
        },
      });
  }

  completeReceiving() {
    const order = this.state.selectedOrder();
    if (!order) return;

    if (this.state.hasPendingLines()) {
      alert('Debe procesar todas las líneas antes de completar la orden');
      return;
    }

    if (!confirm('¿Está seguro de completar esta orden de recepción?')) {
      return;
    }

    this.processing.set(true);

    this.api.completeReceiving(order.id).subscribe({
      next: (updatedOrder) => {
        this.state.updateOrderInList(updatedOrder);
        alert('Orden de recepción completada correctamente');
        this.router.navigate(['/wms/receiving']);
      },
      error: (err) => {
        alert('Error al completar recepción: ' + (err.error?.message || err.message));
        this.processing.set(false);
      },
    });
  }

  resetForm() {
    this.barcodeInput.set('');
    this.scannedLine.set(null);
    this.selectedLocation.set(null);
    this.receivedQuantity.set(0);
    this.damageQuantity.set(0);
    this.notes.set('');
  }

  goBack() {
    this.router.navigate(['/wms/receiving']);
  }

  getLineStatusBadge(status: string): string {
    const classes: Record<string, string> = {
      pending: 'badge-warning',
      received: 'badge-success',
      partial: 'badge-info',
    };
    return classes[status] || 'badge-secondary';
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

  getLineStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      received: 'Recibido',
      partial: 'Parcial',
    };
    return labels[status] || status;
  }
}
