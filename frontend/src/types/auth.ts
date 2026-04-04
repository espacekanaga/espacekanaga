export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'CLIENT';

export type ClientType = 'pressing' | 'atelier' | 'both';

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
  clientType?: ClientType;
  theme?: 'dark' | 'light' | 'system';
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

export interface RegisterClientPayload {
  prenom: string;
  nom: string;
  telephone: string;
  email?: string;
  adresse?: string;
  clientType: ClientType;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
