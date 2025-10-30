import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink,
    import('@angular/material/toolbar').then(m => m.MatToolbarModule),
    import('@angular/material/button').then(m => m.MatButtonModule),
    import('@angular/material/icon').then(m => m.MatIconModule)
  ],
  template: `
    <mat-toolbar color="primary" class="mat-elevation-z2">
      <button mat-button routerLink="/tasks" class="brand">
        <mat-icon>check_circle</mat-icon>
        <span>{{ title() }}</span>
      </button>
      <span class="spacer"></span>
      <a mat-button routerLink="/tasks">Tasks</a>
      <a mat-button routerLink="/login" *ngIf="!auth.isAuthenticated()">Login</a>
      <span class="welcome" *ngIf="auth.isAuthenticated()">Hello, {{ auth.user()?.userName || auth.user()?.email }}</span>
      <button mat-stroked-button color="accent" *ngIf="auth.isAuthenticated()" (click)="logout()">
        <mat-icon>logout</mat-icon>
        Logout
      </button>
    </mat-toolbar>
    <main class="main">
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
