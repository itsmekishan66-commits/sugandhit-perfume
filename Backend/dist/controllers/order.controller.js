import { placeOrder, listAllOrders, listUserOrders as listUserOrdersService, updateOrderStatus, } from '../services/order.service.js';
export const place = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        await placeOrder({ userId, items, amount, address });
        res.json({ success: true, message: 'Order Placed' });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
export const placeOrderKhalti = async (_req, res) => {
    res.json({ success: false, message: 'Khalti not configured yet' });
};
export const placeOrderEsewa = async (_req, res) => {
    res.json({ success: false, message: 'eSewa not configured yet' });
};
export const listAllOrdersController = async (_req, res) => {
    try {
        const orders = await listAllOrders();
        res.json({ success: true, orders });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
export const listUserOrders = async (req, res) => {
    try {
        const { userId } = req.body;
        const orders = await listUserOrdersService(Number(userId));
        res.json({ success: true, orders });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
export const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await updateOrderStatus(orderId, status);
        res.json({ success: true, message: 'Status Updated' });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
