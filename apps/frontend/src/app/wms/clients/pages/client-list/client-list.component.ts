import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClientsStateService } from '../../services/clients-state.service';
import { Client } from '@cadena24-wms/shared';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.scss',
})
export class ClientListComponent implements OnInit {
  private router = inject(Router);
  protected state = inject(ClientsStateService);

  ngOnInit() {
    this.state.loadClients();
  }

  onSearch(term: string) {
    this.state.setSearchFilter(term || null);
  }

  clearFilters() {
    this.state.reset();
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
}
