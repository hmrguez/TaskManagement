import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule,
    import('@angular/material/card').then(m => m.MatCardModule),
    import('@angular/material/form-field').then(m => m.MatFormFieldModule),
    import('@angular/material/input').then(m => m.MatInputModule),
    import('@angular/material/button').then(m => m.MatButtonModule)
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  mode: 'login' | 'signup' = 'login';
  email = '';
  password = '';
  userName = '';
  loading = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  switchMode(mode: 'login' | 'signup') {
    this.mode = mode;
    this.error = null;
  }

  submit() {
    this.error = null;
    this.loading = true;
    if (this.mode === 'login') {
      this.auth.login({ email: this.email, password: this.password }).subscribe({
        next: () => this.router.navigateByUrl('/tasks'),
        error: () => {
          this.error = 'Unable to authenticate. Please check your credentials.';
          this.loading = false;
        }
      });
    } else {
      this.auth
        .signup({ email: this.email, userName: this.userName || this.email, password: this.password })
        .subscribe({
          next: () => this.router.navigateByUrl('/tasks'),
          error: () => {
            this.error = 'Unable to sign up. Please try a different email or username.';
            this.loading = false;
          }
        });
    }
  }
}
