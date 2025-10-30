import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { TaskDetailsComponent } from './components/task-details/task-details.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'tasks/:id', component: TaskDetailsComponent, canActivate: [() => inject(AuthGuard).canActivate()] },
  { path: 'tasks', component: TasksComponent, canActivate: [() => inject(AuthGuard).canActivate()] },
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  { path: '**', redirectTo: 'tasks' }
];
