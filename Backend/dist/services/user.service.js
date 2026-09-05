import { eq } from 'drizzle-orm';
import validator from 'validator';
import db from '../config/db.js';
import { users } from '../models/schema.js';
import { createToken, createAdminToken, hashPassword, verifyPassword, serializeUser } from '../utils/helper.js';
export const registerUser = async ({ name, email, password }) => {
    const exists = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (exists)
        throw new Error('User already exists');
    if (!validator.isEmail(email)) {
        throw new Error('Please enter a valid email address.');
    }
    if (password.length < 8) {
        throw new Error('Please enter a strong password.');
    }
    const hashedPassword = await hashPassword(password);
    const user = await db.insert(users).values({ name, email, password: hashedPassword }).returning({ id: users.id });
    return createToken(user[0].id);
};
export const loginUser = async ({ email, password }) => {
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user)
        throw new Error("User doesn't exist.");
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch)
        throw new Error('Invalid credentials');
    return createToken(user.id);
};
export const adminLogin = async ({ email, password }) => {
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        return createAdminToken(email, password);
    }
    throw new Error('Invalid Credentials');
};
export const getUserById = async (userId) => {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    return user ? serializeUser(user) : null;
};
export const updateUserById = async (userId, data) => {
    const patch = {};
    if (data.name !== undefined)
        patch.name = data.name;
    if (data.phone !== undefined)
        patch.phone = data.phone;
    if (data.address !== undefined)
        patch.address = data.address;
    if (Object.keys(patch).length === 0)
        throw new Error('Nothing to update');
    const updated = await db.update(users).set(patch).where(eq(users.id, userId)).returning();
    return serializeUser(updated[0]);
};
