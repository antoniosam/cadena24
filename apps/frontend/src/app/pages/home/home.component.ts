import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ApiResponse } from '@cadena24-wms/shared';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  apiStatus = signal<{ status: string; version: string } | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.checkApiHealth();
  }

  checkApiHealth(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getHealth().subscribe({
      next: (response: ApiResponse<{ status: string; version: string }>) => {
        if (response.success && response.data) {
          this.apiStatus.set(response.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudo conectar con el servidor');
        this.loading.set(false);
        console.error('API Health check failed:', err);
      },
    });
  }
}
