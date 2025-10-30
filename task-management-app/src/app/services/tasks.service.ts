import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from '../config';
import { CreateTaskRequest, PagedResult, Task, UpdateTaskRequest } from '../models/task.models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly base = `${API_BASE_URL}/api/todos`;

  constructor(private http: HttpClient) {}

  getTasks(pageNumber = 1, pageSize = 10): Observable<PagedResult<Task>> {
    const params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    return this.http.get<PagedResult<Task>>(this.base, { params });
  }

  getTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.base}/${id}`);
  }

  createTask(payload: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(this.base, payload);
  }

  updateTask(id: number, payload: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.base}/${id}`, payload);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
