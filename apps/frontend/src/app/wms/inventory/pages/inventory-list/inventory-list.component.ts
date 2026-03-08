import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryStateService } from '../../services/inventory-state.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss',
})
export class InventoryListComponent implements OnInit {
  protected state = inject(InventoryStateService);

  warehouseId = '';
  productId = '';

  ngOnInit() {
    this.state.loadInventory();
  }

  onFilterByWarehouse() {
    this.state.loadInventory({
      warehouseId: this.warehouseId || undefined,
      productId: this.productId || undefined,
    });
  }

  onLoadTransactions() {
    this.state.loadTransactions({
      warehouseId: this.warehouseId || undefined,
      productId: this.productId || undefined,
      limit: 50,
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      available: 'Disponible',
      reserved: 'Reservado',
      damaged: 'Dañado',
      quarantine: 'Cuarentena',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      available: 'badge-success',
      reserved: 'badge-warning',
      damaged: 'badge-danger',
      quarantine: 'badge-secondary',
    };
    return classes[status] || '';
  }

  getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      RECEIVE: 'Recepción',
      MOVE: 'Movimiento',
      PICK: 'Picking',
      ADJUST: 'Ajuste',
      DAMAGE: 'Daño',
    };
    return labels[type] || type;
  }
}
