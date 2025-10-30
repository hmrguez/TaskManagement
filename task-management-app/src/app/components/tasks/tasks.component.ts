import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksService } from '../../services/tasks.service';
import { Task } from '../../models/task.models';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent {
  // list & pagination
  tasks = signal<Task[]>([]);
  totalCount = signal(0);
  pageNumber = signal(1);
  pageSize = signal(10);
  loading = signal(false);
  error = signal<string | null>(null);

  // create/edit
  newTitle = '';
  newDescription = '';
  newDueDate: string | null = null; // yyyy-MM-ddTHH:mm

  editingId: number | null = null;
  editTitle = '';
  editDescription = '';
  editDueDate: string | null = null;

  constructor(private tasksApi: TasksService) {
    effect(() => {
      // refetch when page changes
      this.fetchTasks();
    });
  }

  fetchTasks() {
    this.loading.set(true);
    this.error.set(null);
    this.tasksApi.getTasks(this.pageNumber(), this.pageSize()).subscribe({
      next: (res) => {
        this.tasks.set(res.Todos);
        this.totalCount.set(res.TotalCount);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load tasks. Make sure the API is running and you are logged in.');
        this.loading.set(false);
      }
    });
  }

  createTask() {
    if (!this.newTitle.trim()) return;
    const payload: any = { title: this.newTitle.trim() };
    if (this.newDescription.trim()) payload.description = this.newDescription.trim();
    if (this.newDueDate) payload.dueDate = new Date(this.newDueDate).toISOString();

    this.loading.set(true);
    this.tasksApi.createTask(payload).subscribe({
      next: () => {
        this.newTitle = '';
        this.newDescription = '';
        this.newDueDate = null;
        this.fetchTasks();
      },
      error: () => {
        this.error.set('Failed to create task.');
        this.loading.set(false);
      }
    });
  }

  startEdit(t: Task) {
    this.editingId = t.Id;
    this.editTitle = t.Title;
    this.editDescription = t.Description || '';
    this.editDueDate = t.DueDate ? this.toLocalInputValue(t.DueDate) : null;
  }

  cancelEdit() {
    this.editingId = null;
  }

  saveEdit(t: Task) {
    if (this.editingId !== t.Id) return;
    const payload: any = { title: this.editTitle };
    payload.description = this.editDescription || undefined;
    payload.dueDate = this.editDueDate ? new Date(this.editDueDate).toISOString() : undefined;

    this.loading.set(true);
    this.tasksApi.updateTask(t.Id, payload).subscribe({
      next: () => {
        this.editingId = null;
        this.fetchTasks();
      },
      error: () => {
        this.error.set('Failed to update task.');
        this.loading.set(false);
      }
    });
  }

  toggleCompleted(t: Task) {
    this.tasksApi.updateTask(t.Id, { isCompleted: !t.IsCompleted }).subscribe({
      next: () => this.fetchTasks(),
      error: () => this.error.set('Failed to update task status.')
    });
  }

  deleteTask(t: Task) {
    if (!confirm('Delete this task?')) return;
    this.tasksApi.deleteTask(t.Id).subscribe({
      next: () => this.fetchTasks(),
      error: () => this.error.set('Failed to delete task.')
    });
  }

  nextPage() {
    if (this.pageNumber() * this.pageSize() >= this.totalCount()) return;
    this.pageNumber.set(this.pageNumber() + 1);
  }

  prevPage() {
    if (this.pageNumber() <= 1) return;
    this.pageNumber.set(this.pageNumber() - 1);
  }

  private toLocalInputValue(iso: string): string {
    // Convert ISO to yyyy-MM-ddTHH:mm in local time for input[type=datetime-local]
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }
}
