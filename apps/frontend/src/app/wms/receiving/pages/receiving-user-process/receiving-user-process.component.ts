import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReceivingStateService } from '../../services/receiving-state.service';
import { ReceivingApiService } from '../../services/receiving-api.service';
import { UsersService } from '../../../../pages/users/services/users.service';
import { IUserSummary, RoleCode, Location } from '@cadena24-wms/shared';
import { map } from 'rxjs';

@Component({
  selector: 'app-receiving-user-process',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './receiving-user-process.component.html',
  styleUrls: ['../receiving-process/receiving-process.component.scss'],
})
export class ReceivingUserProcessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected state = inject(ReceivingStateService);
  private receivingApiService = inject(ReceivingApiService);
  private usersService = inject(UsersService);

  users = signal<IUserSummary[]>([]);
  processing = signal<boolean>(false);

  filteredLines = signal<any[]>([]);
  availableLocations = signal<Location[]>([]);

  userForm = new FormGroup({
    user: new FormControl<IUserSummary | null>(null, Validators.required),
  });

  selectedUser = toSignal(this.userForm.get('user')!.valueChanges, {
    initialValue: this.userForm.get('user')?.value as IUserSummary | null,
  });

  constructor() {
    effect(() => {
      const user = this.selectedUser();
      const order = this.state.selectedOrder();

      if (user && order) {
        // Fetch products
        this.receivingApiService
          .getFilteredProductsForUser(order.id, user.id)
          .subscribe((lines) => {
            this.filteredLines.set(lines);
          });

        // Fetch locations
        if (user.classificationId) {
          this.receivingApiService.getLocationsForUser(user.classificationId).subscribe((locs) => {
            this.availableLocations.set(locs);
          });
        }
      } else {
        this.filteredLines.set([]);
        this.availableLocations.set([]);
      }
    });
  }

  ngOnInit() {
    this.state.clearSelectedOrder();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.state.loadReceivingOrder(id);
    }

    // Fetch users with role 'USER'
    this.usersService
      .getAll({ role: RoleCode.USER })
      .pipe(map((res) => res.data || []))
      .subscribe((data) => {
        this.users.set(data);
      });
  }

  onAssign() {
    if (this.userForm.invalid || !this.selectedUser() || !this.state.selectedOrder()) return;
    this.processing.set(true);

    this.receivingApiService
      .assignUser(this.state.selectedOrder()!.id, this.selectedUser()!.id)
      .subscribe({
        next: () => {
          this.processing.set(false);
          this.router.navigate(['/wms/receiving']);
        },
        error: (err) => {
          console.error('Error assigning user:', err);
          this.processing.set(false);
          // TODO: Display error message
        },
      });
  }
}
