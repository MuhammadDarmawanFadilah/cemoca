import { User } from '@/types/user';
import { ApiClient } from './apiClient';

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export class AuthService {
  static async login(credentials: AuthRequest): Promise<AuthResponse> {
    return ApiClient.post<AuthResponse>('/api/auth/login', credentials);
  }

  static async logout(): Promise<void> {
    return ApiClient.post<void>('/api/auth/logout', {});
  }

  static async getCurrentUser(): Promise<User> {
    return ApiClient.get<User>('/api/auth/me');
  }

  static async refreshToken(): Promise<AuthResponse> {
    return ApiClient.post<AuthResponse>('/api/auth/refresh', {});
  }
}