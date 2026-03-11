import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReceivingStateService } from '../../services/receiving-state.service';
import { ReceivingApiService } from '../../services/receiving-api.service';
import { Location, ReceivingOrderLine } from '@cadena24-wms/shared';

const LAST_LOCATION_KEY = 'receiving_last_location';

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
  locationWarning = signal<boolean>(false);
  receivedQuantity = signal<number>(0);
  damageQuantity = signal<number>(0);
  notes = signal<string>('');

  processing = signal<boolean>(false);
  successMessage = signal<string | null>(null);

  // Progress computed from order lines
  progressPercent = computed(() => {
    const order = this.state.selectedOrder();
    if (!order?.lines?.length) return 0;
    const received = order.lines.filter(
      (l) => l.status === 'received' || l.status === 'partial'
    ).length;
    return Math.round((received / order.lines.length) * 100);
  });

  progressLabel = computed(() => {
    const order = this.state.selectedOrder();
    if (!order?.lines?.length) return '0 / 0 líneas';
    const received = order.lines.filter(
      (l) => l.status === 'received' || l.status === 'partial'
    ).length;
    return `${received} / ${order.lines.length} líneas`;
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const isProcessRoute = this.route.snapshot.url.some((segment) => segment.path === 'process');

    this.isViewOnly.set(!isProcessRoute);

    if (id) {
      this.state.loadReceivingOrder(id);
      this.state.loadReceivingLocations(id);

      if (isProcessRoute) {
        // Restore last selected location from localStorage
        this.restoreLastLocation();

        setTimeout(() => {
          const order = this.state.selectedOrder();
          if (order && order.status === 'pending') {
            this.startReceiving();
          }
        }, 500);
      }
    }
  }

  /** Tries to restore the last used location once locations are available */
  private restoreLastLocation() {
    const saved = localStorage.getItem(LAST_LOCATION_KEY);
    if (!saved) return;

    try {
      const lastLocation: Location = JSON.parse(saved);
      // Wait for locations to load, then match by id
      const tryRestore = () => {
        const locations = this.state.availableLocations();
        if (locations.length === 0) {
          setTimeout(tryRestore, 300);
          return;
        }
        const match = locations.find((l) => l.id === lastLocation.id);
        if (match) {
          this.selectedLocation.set(match);
        }
      };
      tryRestore();
    } catch {
      localStorage.removeItem(LAST_LOCATION_KEY);
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

    const line = order.lines.find((l) => l.product?.barcodes?.some((b) => b.barcode === barcode));

    if (line) {
      this.scannedLine.set(line);
      this.receivedQuantity.set(line.expectedQuantity);
      this.damageQuantity.set(0);
      this.successMessage.set(`Producto encontrado: ${line.product?.name}`);

      // Show location warning if none selected
      if (!this.selectedLocation()) {
        this.locationWarning.set(true);
      }
    } else {
      this.scannedLine.set(null);
      alert(`Producto con código de barras ${barcode} no encontrado en esta orden`);
    }
  }

  selectLocation(location: Location) {
    this.selectedLocation.set(location);
    this.locationWarning.set(false);
    // Persist selection for next time
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location));
  }

  onReceiveLine() {
    const order = this.state.selectedOrder();
    const line = this.scannedLine();
    const location = this.selectedLocation();

    if (!location) {
      this.locationWarning.set(true);
      return;
    }

    if (!order || !line) {
      alert('Debe escanear un producto antes de confirmar');
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
          this.focusBarcodeInput();
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

  focusBarcodeInput() {
    setTimeout(() => {
      const input = document.getElementById('barcode-input') as HTMLInputElement | null;
      input?.focus();
    }, 50);
  }

  resetForm() {
    this.barcodeInput.set('');
    this.scannedLine.set(null);
    // NOTE: selectedLocation is intentionally NOT reset — persists for the session
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
