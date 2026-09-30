export interface User {
  _id: string;
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: number;
  creditBalance?: number;
}
