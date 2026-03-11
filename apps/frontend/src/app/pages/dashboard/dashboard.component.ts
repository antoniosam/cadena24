import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from './services/dashboard-state.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  state = inject(DashboardStateService);

  ngOnInit() {
    this.state.loadAll();
  }

  // Stock by Category Chart
  stockByCategoryData = computed<ChartData<'pie'>>(() => {
    const data = this.state.stockByCategory();
    return {
      labels: data.map((d) => (d.category === 'Uncategorized' ? 'Sin Categoría' : d.category)),
      datasets: [
        {
          data: data.map((d) => d.quantity),
          backgroundColor: ['#137fec', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
        },
      ],
    };
  });

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Daily Movements Chart
  movementsData = computed<ChartData<'line'>>(() => {
    const data = this.state.dailyMovements();
    return {
      labels: data.map((d) => d.date),
      datasets: [
        {
          data: data.map((d) => d.receivings),
          label: 'Recepciones',
          borderColor: '#137fec',
          backgroundColor: 'rgba(19, 127, 236, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          data: data.map((d) => d.picks),
          label: 'Picking',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  });

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
  };

  // Orders by Status Chart
  ordersByStatusData = computed<ChartData<'doughnut'>>(() => {
    const data = this.state.ordersByStatus();
    const statusMap: Record<string, string> = {
      pending: 'PENDIENTE',
      picking: 'EN PREPARACIÓN',
      picked: 'PREPARADO',
      shipped: 'ENVIADO',
    };
    return {
      labels: data.map((d) => statusMap[d.status] || d.status.toUpperCase()),
      datasets: [
        {
          data: data.map((d) => d.count),
          backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'],
        },
      ],
    };
  });

  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  exportReport() {
    window.location.href = '/api/reports/inventory/stock/excel';
  }
}
