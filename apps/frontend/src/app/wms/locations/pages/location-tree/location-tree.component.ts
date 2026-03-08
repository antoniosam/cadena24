import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationsStateService } from '../../services/locations-state.service';
import { Location, LocationTreeNode } from '@cadena24-wms/shared';

@Component({
  selector: 'app-location-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-tree.component.html',
  styleUrl: './location-tree.component.scss',
})
export class LocationTreeComponent implements OnInit {
  protected state = inject(LocationsStateService);

  selectedWarehouseId = signal<number | null>(null);
  expandedZones = signal<Set<string>>(new Set());
  expandedRows = signal<Map<string, Set<string>>>(new Map());
  expandedPositions = signal<Map<string, Set<string>>>(new Map());

  ngOnInit() {
    // Load warehouses or default warehouse
    const defaultWarehouseId = 1; // TODO: Get from context or user selection
    this.loadTree(defaultWarehouseId);
  }

  loadTree(warehouseId: number) {
    this.selectedWarehouseId.set(warehouseId);
    this.state.loadLocationTree(warehouseId);
  }

  toggleZone(zone: string) {
    const expanded = this.expandedZones();
    const newExpanded = new Set(expanded);
    if (newExpanded.has(zone)) {
      newExpanded.delete(zone);
    } else {
      newExpanded.add(zone);
    }
    this.expandedZones.set(newExpanded);
  }

  toggleRow(zone: string, row: string) {
    const expanded = this.expandedRows();
    const newExpanded = new Map(expanded);
    const zoneRows = newExpanded.get(zone) || new Set();
    const newZoneRows = new Set(zoneRows);

    if (newZoneRows.has(row)) {
      newZoneRows.delete(row);
    } else {
      newZoneRows.add(row);
    }
    newExpanded.set(zone, newZoneRows);
    this.expandedRows.set(newExpanded);
  }

  togglePosition(zone: string, row: string, position: string) {
    const expanded = this.expandedPositions();
    const key = `${zone}-${row}`;
    const newExpanded = new Map(expanded);
    const positions = newExpanded.get(key) || new Set();
    const newPositions = new Set(positions);

    if (newPositions.has(position)) {
      newPositions.delete(position);
    } else {
      newPositions.add(position);
    }
    newExpanded.set(key, newPositions);
    this.expandedPositions.set(newExpanded);
  }

  isZoneExpanded(zone: string): boolean {
    return this.expandedZones().has(zone);
  }

  isRowExpanded(zone: string, row: string): boolean {
    return this.expandedRows().get(zone)?.has(row) || false;
  }

  isPositionExpanded(zone: string, row: string, position: string): boolean {
    const key = `${zone}-${row}`;
    return this.expandedPositions().get(key)?.has(position) || false;
  }

  onSelectLocation(location: Location) {
    this.state.selectedLocation.set(location);
  }
}
