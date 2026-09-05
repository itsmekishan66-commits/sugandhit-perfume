import { placeCustomOrder, listUserCustomOrders, listAllCustomOrders, updateCustomOrderStatus, } from '../services/customOrder.service.js';
export const place = async (req, res) => {
    try {
        const { userId, name, bottleSize, topNotes, heartNotes, baseNotes, perfumeBase, strength, strengthName, customLabel, amount, address, } = req.body;
        await placeCustomOrder({
            userId,
            name,
            bottleSize,
            topNotes,
            heartNotes,
            baseNotes,
            perfumeBase,
            strength,
            strengthName,
            customLabel,
            amount,
            address,
        });
        res.json({ success: true, message: 'Custom Perfume Order Placed!' });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
export const listUserController = async (req, res) => {
    try {
        const { userId } = req.body;
        const orders = await listUserCustomOrders(Number(userId));
        res.json({ success: true, orders });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
export const listAllController = async (_req, res) => {
    try {
        const orders = await listAllCustomOrders();
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
        await updateCustomOrderStatus(orderId, status);
        res.json({ success: true, message: 'Status Updated' });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
