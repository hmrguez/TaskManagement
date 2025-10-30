import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../config';
import { AuthResponse, LoginRequest, SignupRequest } from '../models/auth.models';
import { tap } from 'rxjs';

const TOKEN_KEY = 'tm_token';
const USER_KEY = 'tm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _token = signal<string | null>(this.readToken());
  readonly isAuthenticated = signal<boolean>(!!this._token());
  readonly user = signal<{ userId: string; email: string; userName: string } | null>(this.readUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest) {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, req).pipe(
      tap((res) => this.setAuth(res))
    );
  }

  signup(req: SignupRequest) {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/signup`, req).pipe(
      tap((res) => this.setAuth(res))
    );
  }

  logout() {
    this._token.set(null);
    this.isAuthenticated.set(false);
    this.user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigateByUrl('/login');
  }

  getToken(): string | null {
    return this._token();
  }

  private setAuth(res: AuthResponse) {
    this._token.set(res.Token);
    this.isAuthenticated.set(true);
    const user = { userId: res.UserId, email: res.Email, userName: res.UserName };
    this.user.set(user);
    localStorage.setItem(TOKEN_KEY, res.Token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readUser(): { userId: string; email: string; userName: string } | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
