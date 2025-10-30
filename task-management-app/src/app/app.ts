import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule
  ],
  template: `
    <mat-toolbar color="primary" class="mat-elevation-z2">
      <button mat-button routerLink="/tasks" class="flex items-center gap-2">
        <mat-icon>check_circle</mat-icon>
        <span>{{ title() }}</span>
      </button>
      <span class="flex-1"></span>
      <a mat-button routerLink="/login" *ngIf="!auth.isAuthenticated()">Login</a>
      <span class="mr-2" *ngIf="auth.isAuthenticated()">Hello, {{ auth.user()?.userName || auth.user()?.email }}</span>
      <button mat-stroked-button color="accent" *ngIf="auth.isAuthenticated()" (click)="logout()">
        <mat-icon>logout</mat-icon>
        Logout
      </button>
    </mat-toolbar>
    <main class="p-4">
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Task Manager');
  protected readonly auth = inject(AuthService);

  logout() {
    this.auth.logout();
  }
}
