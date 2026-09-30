import { backendUrl } from '@/config/constants';
import type { Admin, Customer, HistoryOrder } from './users.types';

export interface UsersPayload {
  success: boolean;
  users: Customer[];
  totalCustomers: number;
  totalAdmins: number;
  message?: string;
}

export interface AdminsPayload {
  success: boolean;
  admins: Admin[];
  message?: string;
}

export interface UsersResult {
  users: UsersPayload;
  admins: AdminsPayload;
}

export interface UserDetailPayload {
  success: boolean;
  user: Customer;
  orders: HistoryOrder[];
  customOrders: HistoryOrder[];
  message?: string;
}

export interface CreditResult {
  success: boolean;
  user: Customer;
  message?: string;
}

export async function fetchUsers(token: string): Promise<UsersResult> {
  const [usersRes, adminsRes] = await Promise.all([
    fetch(backendUrl +'/api/accounts/users', { headers: { token } }),
    fetch(backendUrl +'/api/accounts/admins', { headers: { token } }),
  ]);
  return {
    users: await usersRes.json(),
    admins: await adminsRes.json(),
  };
}

export async function apiFetchUserDetail(
  token: string,
  body: { userId: number | string }
): Promise<UserDetailPayload> {
  const response = await fetch(backendUrl +'/api/accounts/user/details', {
    method:'POST',
    headers: {'Content-Type':'application/json', token },
    body: JSON.stringify(body),
  });
  return response.json();
}

export async function apiAddUserCredit(
  token: string,
  body: { userId: number; amount: number }
): Promise<CreditResult> {
  const response = await fetch(backendUrl +'/api/accounts/user/credit', {
    method:'POST',
    headers: {'Content-Type':'application/json', token },
    body: JSON.stringify(body),
  });
  return response.json();
}
