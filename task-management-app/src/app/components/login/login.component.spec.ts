import { TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let authSpy: jest.Mocked<AuthService>;
  let routerSpy: any;

  beforeEach(async () => {
    authSpy = {
      login: jest.fn(),
      signup: jest.fn()
    } as unknown as jest.Mocked<AuthService>;
    routerSpy = { navigateByUrl: jest.fn() } as unknown as Router;

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should switch modes and clear error', () => {
    component.error = 'x';
    component.switchMode('signup');
    expect(component.mode).toBe('signup');
    expect(component.error).toBeNull();
    component.switchMode('login');
    expect(component.mode).toBe('login');
  });

  it('should login successfully and navigate to /tasks', () => {
    component.mode = 'login';
    component.email = 'a@b.com';
    component.password = 'pass';
    authSpy.login.mockReturnValue(of({} as any));

    component.submit();

    expect(authSpy.login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass' });
    expect((routerSpy.navigateByUrl as any)).toHaveBeenCalledWith('/tasks');
  });

  it('should set error on login failure and stop loading', () => {
    component.mode = 'login';
    authSpy.login.mockReturnValue(throwError(() => new Error('bad')));

    component.submit();

    expect(component.error).toBe('Unable to authenticate. Please check your credentials.');
    expect(component.loading).toBe(false);
  });

  it('should signup successfully (with username fallback) and navigate to /tasks', () => {
    component.mode = 'signup';
    component.email = 'c@d.com';
    component.userName = ''; // should fallback to email
    component.password = 'p';
    authSpy.signup.mockReturnValue(of({} as any));

    component.submit();

    expect(authSpy.signup).toHaveBeenCalledWith({ email: 'c@d.com', userName: 'c@d.com', password: 'p' });
    expect((routerSpy.navigateByUrl as any)).toHaveBeenCalledWith('/tasks');
  });

  it('should set error on signup failure and stop loading', () => {
    component.mode = 'signup';
    authSpy.signup.mockReturnValue(throwError(() => new Error('no')));

    component.submit();

    expect(component.error).toBe('Unable to sign up. Please try a different email or username.');
    expect(component.loading).toBe(false);
  });
});
