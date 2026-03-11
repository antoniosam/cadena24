import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProvidersStateService } from '../../services/providers-state.service';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-list.component.html',
  styleUrl: './provider-list.component.scss',
})
export class ProviderListComponent implements OnInit {
  private router = inject(Router);
  protected state = inject(ProvidersStateService);

  ngOnInit() {
    this.state.loadProviders();
  }

  onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    this.state.setSearchTerm(term);
  }

  clearFilters() {
    this.state.reset();
    this.state.loadProviders();
  }

  onPageChange(page: number) {
    this.state.setPage(page);
  }

  onCreate() {
    this.router.navigate(['/wms/providers/new']);
  }

  onEdit(id: number) {
    this.router.navigate(['/wms/providers', id, 'edit']);
  }

  onDelete(id: number) {
    this.state.deleteProvider(id);
  }
}
