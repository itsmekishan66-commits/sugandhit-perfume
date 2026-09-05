import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
export const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
};
export const createAdminToken = (email, password) => {
    return jwt.sign(email + password, process.env.JWT_SECRET);
};
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};
export const verifyPassword = (password, hash) => {
    return bcrypt.compare(password, hash);
};
export const serializeUser = (u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    address: u.address || {},
    createdAt: u.createdAt,
});
export const serializeProduct = (p) => ({
    ...p,
    _id: String(p.id),
    price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
});
export const serializeOrder = (o) => ({
    ...o,
    _id: String(o.id),
    amount: typeof o.amount === 'string' ? parseFloat(o.amount) : o.amount,
});
export const serializeCustomOrder = (o) => ({
    ...o,
    _id: String(o.id),
    amount: typeof o.amount === 'string' ? parseFloat(o.amount) : o.amount,
});
