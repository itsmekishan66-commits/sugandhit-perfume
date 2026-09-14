import express from 'express';
import adminAuth from '../middleware/adminAuth.middleware.js';

const accountsRouter = express.Router();

accountsRouter.get('/', adminAuth, (req, res) => {
  res.json({ success: true, admins: [] });
});

accountsRouter.post('/', adminAuth, (req, res) => {
  res.json({ success: true, message: 'Admin account added.' });
});

export default accountsRouter;