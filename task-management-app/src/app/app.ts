import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <header class="header">
      <h1 class="title"><a routerLink="/tasks">{{ title() }}</a></h1>
      <nav class="nav">
        <a routerLink="/tasks">Tasks</a>
        <a routerLink="/login" *ngIf="!auth.isAuthenticated()">Login</a>
        <span *ngIf="auth.isAuthenticated()">Hello, {{ auth.user()?.userName || auth.user()?.email }}</span>
        <button *ngIf="auth.isAuthenticated()" (click)="logout()">Logout</button>
      </nav>
    </header>
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
