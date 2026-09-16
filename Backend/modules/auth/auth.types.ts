export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: Record<string, string>;
}

export interface LoginInput {
  email: string;
  password: string;
}