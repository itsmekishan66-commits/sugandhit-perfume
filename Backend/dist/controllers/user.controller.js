import { registerUser, loginUser, adminLogin, getUserById, updateUserById } from '../services/user.service.js';
const ok = (res, payload, message) => {
    res.json({ success: true, ...(message ? { message } : {}), ...payload });
};
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const token = await registerUser({ name, email, password });
        res.json({ success: true, token });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await loginUser({ email, password });
        res.json({ success: true, token });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
export const adminLoginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await adminLogin({ email, password });
        res.json({ success: true, token });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
export const getProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await getUserById(Number(userId));
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        ok(res, { user });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
export const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address } = req.body;
        const user = await updateUserById(Number(userId), { name, phone, address });
        ok(res, { user }, 'Profile updated');
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
