import { Component, TemplateRef, ViewChild, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksService } from '../../services/tasks.service';
import { Task } from '../../models/task.models';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTimepickerModule,
    MatDialogModule
  ],
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

  // search
  searchText = signal('');

  // create/edit
  newTitle = '';
  newDescription = '';
  newDueDate: Date | null = null;

  editingId: number | null = null;
  editTitle = '';
  editDescription = '';
  editDueDate: Date | null = null;

  @ViewChild('createTaskDialog') createTaskDialog!: TemplateRef<any>;
  private dialogRef?: MatDialogRef<any>;

  constructor(private tasksApi: TasksService, private dialog: MatDialog) {
    effect(() => {
      // refetch when page or search changes
      // touch the signals to create dependency
      this.pageNumber();
      this.searchText();
      this.fetchTasks();
    });
  }

  fetchTasks() {
    this.loading.set(true);
    this.error.set(null);
    this.tasksApi.getTasks(this.pageNumber(), this.pageSize(), this.searchText()).subscribe({
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

  applySearch(text: string) {
    this.searchText.set(text);
    this.pageNumber.set(1);
  }

  openCreateDialog() {
    this.newTitle = '';
    this.newDescription = '';
    this.newDueDate = null;
    this.dialogRef = this.dialog.open(this.createTaskDialog, { width: '640px' });
  }

  closeCreateDialog() {
    this.dialogRef?.close();
  }

  createTask() {
    if (!this.newTitle.trim()) return;
    const payload: any = { title: this.newTitle.trim() };
    if (this.newDescription.trim()) payload.description = this.newDescription.trim();
    if (this.newDueDate) payload.dueDate = this.newDueDate.toISOString();

    this.loading.set(true);
    this.tasksApi.createTask(payload).subscribe({
      next: () => {
        this.newTitle = '';
        this.newDescription = '';
        this.newDueDate = null;
        this.closeCreateDialog();
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
    this.editDueDate = t.DueDate ? new Date(t.DueDate) : null;
  }

  cancelEdit() {
    this.editingId = null;
  }

  saveEdit(t: Task) {
    if (this.editingId !== t.Id) return;
    const payload: any = { title: this.editTitle };
    payload.description = this.editDescription || undefined;
    payload.dueDate = this.editDueDate ? this.editDueDate.toISOString() : undefined;

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
}
