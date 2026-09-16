export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: Record<string, string>;
  image?: string;
  createdAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

export interface ProfileUpdateInput {
  name: string;
  phone: string;
  address: Record<string, string>;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
  user?: UserProfile;
}