import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TasksService } from '../../services/tasks.service';
import { Task } from '../../models/task.models';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css']
})
export class TaskDetailsComponent {
  private route = inject(ActivatedRoute);
  private api = inject(TasksService);

  loading = signal(true);
  error = signal<string | null>(null);
  task = signal<Task | null>(null);

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!id || Number.isNaN(id)) {
      this.error.set('Invalid task id.');
      this.loading.set(false);
      return;
    }
    this.api.getTask(id).subscribe({
      next: (t) => {
        this.task.set(t);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load task details.');
        this.loading.set(false);
      }
    });
  }
}
