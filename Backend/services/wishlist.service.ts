import { and, eq } from 'drizzle-orm';
import db from '../config/db.js';
import { wishlistitems } from '../models/schema/index.js';

export const getWishlist = async (userId: number): Promise<string[]> => {
  const rows = await db.query.wishlistitems.findMany({ where: eq(wishlistitems.userId, Number(userId)) });
  return rows.map((row) => row.productId);
};

export const addToWishlist = async (userId: number, productId: string) => {
  await db
    .insert(wishlistitems)
    .values({ userId: Number(userId), productId })
    .onConflictDoNothing();
};

export const removeFromWishlist = async (userId: number, productId: string) => {
  await db
    .delete(wishlistitems)
    .where(and(eq(wishlistitems.userId, Number(userId)), eq(wishlistitems.productId, productId)));
};