export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  userName: string;
  password: string;
}

export interface AuthResponse {
  Token: string;
  UserId: string;
  Email: string;
  UserName: string;
}
