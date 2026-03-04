import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar';
import { TopbarComponent } from './topbar/topbar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, SidebarComponent, TopbarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {}
