import type { UpdateProfileInput } from './users.types.js';
import {
  findById,
  update,
  listAll,
  countUsers,
  countAdmins,
  listAllAdmins as listAdmins,
  listAdminRoles as listAdminRolesRepo,
  findWithHistory,
  addCredit,
  removeById,
  type UserListFilters,
  type AdminListFilters,
} from './users.repository.js';
import { buildPaginated, computePagination } from '../../shared/utils/pagination.js';
import type { Paginated } from '../../shared/types/common.types.js';
import type { SerializedUser } from './users.types.js';

export const getUserById = async (userId: number) => findById(userId);

export const updateUserById = async (userId: number, data: UpdateProfileInput) => {
  if (
    data.name === undefined &&
    data.phone === undefined &&
    data.address === undefined &&
    data.image === undefined
  ) {
    throw new Error('Nothing to update');
  }
  return update(userId, data);
};

export async function listAllUsers(): Promise<SerializedUser[]>;
export async function listAllUsers(
  opts: { page?: number; limit?: number } & UserListFilters
): Promise<Paginated<SerializedUser>>;
export async function listAllUsers(
  opts?: { page?: number; limit?: number } & UserListFilters
): Promise<SerializedUser[] | Paginated<SerializedUser>> {
  if (!opts) return listAll();
  const { page, limit, offset } = computePagination(opts);
  return buildPaginated(await listAll({ limit, offset, ...opts }), await countUsers(opts), page, limit);
}

type AdminRow = Awaited<ReturnType<typeof listAdmins>>[number];

export async function listAllAdmins(): Promise<Awaited<ReturnType<typeof listAdmins>>>;
export async function listAllAdmins(opts: { page?: number; limit?: number } & AdminListFilters): Promise<Paginated<AdminRow>>;
export async function listAllAdmins(
  opts?: { page?: number; limit?: number } & AdminListFilters
): Promise<Awaited<ReturnType<typeof listAdmins>> | Paginated<AdminRow>> {
  if (!opts) return listAdmins();
  const { page, limit, offset } = computePagination(opts);
  return buildPaginated(await listAdmins({ limit, offset, ...opts }), await countAdmins(opts), page, limit);
}

export const getUserWithHistory = async (userId: number) => findWithHistory(userId);

export const listAdminRoles = () => listAdminRolesRepo();

export const addUserCredit = async (userId: number, amount: number) => addCredit(userId, amount);

export const deleteUserById = async (userId: number) => removeById(userId);