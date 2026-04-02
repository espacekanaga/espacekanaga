export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email?: string;
  adresse?: string;
  role: UserRole;
  isActive: boolean;
  accessPressing?: boolean;
  accessAtelier?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email?: string;
  telephone?: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
