import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PickingStateService } from '../../services/picking-state.service';
import { PickList, PickListLine } from '@cadena24-wms/shared';

interface PickLineResult {
  lineId: number;
  quantityPicked: number;
  status: string;
  isShort: boolean;
  missing: number;
}

@Component({
  selector: 'app-pick-list-execute',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pick-list-execute.component.html',
  styleUrl: './pick-list-execute.component.scss',
})
export class PickListExecuteComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected state = inject(PickingStateService);

  pickListId = 0;

  // Pick line modal
  showPickModal = false;
  selectedLine: PickListLine | null = null;
  quantityInput = '';
  pickNotes = '';
  lastPickResult: PickLineResult | null = null;

  // Complete confirmation
  showCompleteConfirm = false;

  ngOnInit() {
    this.pickListId = Number(this.route.snapshot.paramMap.get('id'));
    this.state.loadPickList(this.pickListId);
  }

  ngOnDestroy() {
    this.state.clearSelectedPickList();
  }

  get pickList(): PickList | null {
    return this.state.selectedPickList();
  }

  get pendingLines(): PickListLine[] {
    return this.pickList?.lines?.filter((l) => l.status === 'pending') ?? [];
  }

  get processedLines(): PickListLine[] {
    return this.pickList?.lines?.filter((l) => l.status !== 'pending') ?? [];
  }

  get canStart(): boolean {
    return this.pickList?.status === 'pending';
  }

  get canPickLine(): boolean {
    return this.pickList?.status === 'in_progress';
  }

  get canComplete(): boolean {
    return this.pickList?.status === 'in_progress' && this.pendingLines.length === 0;
  }

  get progressPercent(): number {
    const pl = this.pickList;
    if (!pl || pl.totalLines === 0) return 0;
    return Math.round((pl.pickedLines / pl.totalLines) * 100);
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  onStart() {
    this.state.startPickList(this.pickListId, undefined, (msg) => {
      alert(`Error al iniciar: ${msg}`);
    });
  }

  openPickModal(line: PickListLine) {
    if (!this.canPickLine) return;
    this.selectedLine = line;
    this.quantityInput = String(line.quantityToPick);
    this.pickNotes = '';
    this.lastPickResult = null;
    this.showPickModal = true;
  }

  closePickModal() {
    this.showPickModal = false;
    this.selectedLine = null;
    this.lastPickResult = null;
  }

  onConfirmPick() {
    if (!this.selectedLine) return;

    const qty = parseFloat(this.quantityInput);
    if (isNaN(qty) || qty < 0) {
      alert('Ingresa una cantidad válida (0 o mayor)');
      return;
    }

    this.state.pickLine(
      this.pickListId,
      {
        lineId: this.selectedLine.id,
        quantityPicked: qty,
        notes: this.pickNotes || undefined,
      },
      (result) => {
        this.lastPickResult = result;
        if (!result.isShort) {
          // Auto-close on full pick
          setTimeout(() => this.closePickModal(), 800);
        }
      },
      (msg) => {
        alert(`Error al registrar: ${msg}`);
      }
    );
  }

  onMarkShort() {
    if (!this.selectedLine) return;
    this.quantityInput = '0';
  }

  openCompleteConfirm() {
    this.showCompleteConfirm = true;
  }

  closeCompleteConfirm() {
    this.showCompleteConfirm = false;
  }

  onComplete() {
    this.showCompleteConfirm = false;
    this.state.completePickList(
      this.pickListId,
      () => {
        // Stay on page to show completed state
      },
      (msg) => {
        alert(`Error al completar: ${msg}`);
      }
    );
  }

  goBack() {
    this.router.navigate(['/wms/picking']);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'badge-pending',
      picking: 'badge-picking',
      picked: 'badge-picked',
      short: 'badge-short',
      in_progress: 'badge-picking',
      completed: 'badge-completed',
      cancelled: 'badge-cancelled',
    };
    return classes[status] || 'badge-pending';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      picking: 'Surtiendo',
      picked: 'Surtido',
      short: 'Faltante',
      in_progress: 'En Progreso',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  }
}
