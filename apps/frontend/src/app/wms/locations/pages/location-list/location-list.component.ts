import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LocationsStateService } from '../../services/locations-state.service';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-list.component.html',
  styleUrl: './location-list.component.scss',
})
export class LocationListComponent implements OnInit {
  private router = inject(Router);
  protected state = inject(LocationsStateService);

  ngOnInit() {
    this.state.loadLocations();
  }

  onSearch(term: string) {
    this.state.setSearchTerm(term);
  }

  onFilterType(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.state.setTypeFilter(value === '' ? null : (value as any));
  }

  onFilterAvailableOnly(availableOnly: boolean) {
    this.state.setAvailableOnlyFilter(availableOnly);
  }

  clearFilters() {
    this.state.reset();
    this.state.loadLocations();
  }

  onPageChange(page: number) {
    this.state.setPage(page);
  }

  onCreate() {
    this.router.navigate(['/wms/locations/new']);
  }

  onEdit(id: number) {
    this.router.navigate(['/wms/locations', id, 'edit']);
  }

  onView(id: number) {
    this.router.navigate(['/wms/locations', id]);
  }

  onDelete(id: number) {
    if (confirm('¿Está seguro de eliminar esta ubicación?')) {
      this.state.deleteLocation(id);
    }
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      receiving: 'Recepción',
      storage: 'Almacenamiento',
      picking: 'Picking',
      shipping: 'Despacho',
    };
    return labels[type] || type;
  }
}
