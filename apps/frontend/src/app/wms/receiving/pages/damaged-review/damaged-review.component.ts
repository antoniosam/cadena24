import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceivingStateService } from '../../services/receiving-state.service';

@Component({
  selector: 'app-damaged-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Revisión de Items Dañados</h1>

      @if (state.loading()) {
        <div class="loading">Cargando...</div>
      }

      @if (state.damagedItems().length > 0) {
        <table class="table">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Código Producto</th>
              <th>Nombre</th>
              <th>Cantidad Dañada</th>
              <th>Fecha</th>
              <th>Ubicación</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            @for (item of state.damagedItems(); track item.id) {
              <tr>
                <td>{{ item.receivingOrderNumber }}</td>
                <td>{{ item.productCode }}</td>
                <td>{{ item.productName }}</td>
                <td class="damage-qty">{{ item.damageQuantity }}</td>
                <td>{{ item.receivedDate | date: 'short' }}</td>
                <td>{{ item.locationName }}</td>
                <td>{{ item.notes }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <p class="empty-state">No hay items dañados registrados</p>
      }
    </div>
  `,
  styles: [
    `
      .container {
        padding: 20px;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      .table th,
      .table td {
        padding: 12px;
        border: 1px solid #ddd;
        text-align: left;
      }
      .table th {
        background: #f8f9fa;
        font-weight: 600;
      }
      .damage-qty {
        color: #dc3545;
        font-weight: 600;
      }
      .empty-state {
        text-align: center;
        padding: 40px;
        color: #666;
      }
    `,
  ],
})
export class DamagedReviewComponent implements OnInit {
  protected state = inject(ReceivingStateService);

  ngOnInit() {
    this.state.loadDamagedItems();
  }
}
