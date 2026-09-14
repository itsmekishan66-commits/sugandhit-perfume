import express from 'express';
import adminAuth from '../middleware/adminAuth.middleware.js';

const paymentRouter = express.Router();

paymentRouter.get('/', adminAuth, (req, res) => {
  res.json({ success: true, methods: [] });
});

paymentRouter.post('/', adminAuth, (req, res) => {
  res.json({ success: true, message: 'Payment method added.' });
});

export default paymentRouter;