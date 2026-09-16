import type { UpdateProfileInput } from './users.types.js';
import { findById, update, listAll, listAllAdmins as listAdmins, findWithHistory, addCredit } from './users.repository.js';

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

export const listAllUsers = async () => listAll();

export const listAllAdmins = async () => listAdmins();

export const getUserWithHistory = async (userId: number) => findWithHistory(userId);

export const addUserCredit = async (userId: number, amount: number) => addCredit(userId, amount);