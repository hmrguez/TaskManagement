import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { TasksService } from '../../services/tasks.service';
import { Task } from '../../models/task.models';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTimepickerModule
  ],
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css']
})
export class TaskDetailsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(TasksService);

  loading = signal(true);
  error = signal<string | null>(null);
  task = signal<Task | null>(null);

  // edit state
  isEditing = signal(false);
  editTitle = '';
  editDescription = '';
  editDueDate: Date | null = null;

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!id || Number.isNaN(id)) {
      this.error.set('Invalid task id.');
      this.loading.set(false);
      return;
    }
    this.fetch(id);

    const editParam = this.route.snapshot.queryParamMap.get('edit');
    if (editParam === '1' || editParam === 'true') {
      this.startEdit();
    }
  }

  private fetch(id: number) {
    this.loading.set(true);
    this.api.getTask(id).subscribe({
      next: (t) => {
        this.task.set(t);
        this.loading.set(false);
        if (this.isEditing()) {
          // sync form with latest
          this.editTitle = t.Title;
          this.editDescription = t.Description || '';
          this.editDueDate = t.DueDate ? new Date(t.DueDate) : null;
        }
      },
      error: () => {
        this.error.set('Failed to load task details.');
        this.loading.set(false);
      }
    });
  }

  startEdit() {
    const t = this.task();
    if (!t) return;
    this.isEditing.set(true);
    this.editTitle = t.Title;
    this.editDescription = t.Description || '';
    this.editDueDate = t.DueDate ? new Date(t.DueDate) : null;
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  saveEdit() {
    const t = this.task();
    if (!t) return;
    const payload: any = { title: this.editTitle };
    payload.description = this.editDescription || undefined;
    payload.dueDate = this.editDueDate ? this.editDueDate.toISOString() : undefined;

    this.loading.set(true);
    this.api.updateTask(t.Id, payload).subscribe({
      next: () => {
        this.isEditing.set(false);
        this.fetch(t.Id);
      },
      error: () => {
        this.error.set('Failed to update task.');
        this.loading.set(false);
      }
    });
  }

  deleteTask() {
    const t = this.task();
    if (!t) return;
    if (!confirm('Delete this task?')) return;
    this.loading.set(true);
    this.api.deleteTask(t.Id).subscribe({
      next: () => {
        this.router.navigateByUrl('/tasks');
      },
      error: () => {
        this.error.set('Failed to delete task.');
        this.loading.set(false);
      }
    });
  }
}
