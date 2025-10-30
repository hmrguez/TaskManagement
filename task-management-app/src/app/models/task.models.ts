export interface Task {
  Id: number;
  Title: string;
  Description?: string;
  DueDate?: string; // ISO string
  IsCompleted: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  isCompleted?: boolean;
}

export interface PagedResult<T> {
  Todos: T[];
  TotalCount: number;
  PageNumber: number;
  PageSize: number;
}
