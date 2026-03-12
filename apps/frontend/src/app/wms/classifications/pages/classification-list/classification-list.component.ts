import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClassificationsStateService } from '../../services/classifications-state.service';

@Component({
  selector: 'app-classification-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classification-list.component.html',
  styleUrl: './classification-list.component.scss',
})
export class ClassificationListComponent implements OnInit {
  private router = inject(Router);
  protected state = inject(ClassificationsStateService);

  ngOnInit() {
    this.state.loadClassifications();
  }

  onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    this.state.setSearchTerm(term);
  }

  clearFilters() {
    this.state.reset();
    this.state.loadClassifications();
  }

  onPageChange(page: number) {
    this.state.setPage(page);
  }

  onCreate() {
    this.router.navigate(['/wms/classifications/new']);
  }

  onEdit(id: number) {
    this.router.navigate(['/wms/classifications', id, 'edit']);
  }

  onDelete(id: number) {
    this.state.deleteClassification(id);
  }
}
