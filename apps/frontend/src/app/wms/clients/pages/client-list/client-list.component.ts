import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientsStateService } from '../../services/clients-state.service';
import { Client } from '@cadena24-wms/shared';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss',
})
export class ClientListComponent implements OnInit {
  private router = inject(Router);
  protected state = inject(ClientsStateService);

  searchQuery = '';

  ngOnInit() {
    this.state.loadClients();
  }

  onSearch() {
    this.state.setSearchFilter(this.searchQuery || null);
  }

  onFilterStatus(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const isActive = value === 'active' ? true : value === 'inactive' ? false : null;
    this.state.setIsActiveFilter(isActive);
  }

  onPageChange(page: number) {
    this.state.setPage(page);
  }

  onCreate() {
    this.router.navigate(['/wms/clients/new']);
  }

  onEdit(id: number) {
    this.router.navigate(['/wms/clients/edit', id]);
  }

  onToggleStatus(client: Client, event: Event) {
    event.stopPropagation();
    const action = client.isActive ? 'desactivar' : 'activar';
    if (confirm(`¿Está seguro de ${action} al cliente ${client.name}?`)) {
      this.state.setStatus(client.id, !client.isActive);
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.state.totalPages() }, (_, i) => i + 1);
  }
}
