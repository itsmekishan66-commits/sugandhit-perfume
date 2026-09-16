export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  address?: Record<string, string>;
  image?: string;
}

export interface SerializedUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: Record<string, string>;
  image: string;
  credit: number;
  createdAt: Date | null;
}