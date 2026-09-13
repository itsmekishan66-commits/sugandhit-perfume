import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/user.routes.js';
import productRouter from './routes/product.routes.js';
import cartRouter from './routes/cart.routes.js';
import wishlistRouter from './routes/wishlist.routes.js';
import orderRouter from './routes/order.routes.js';
import noteRouter from './routes/note.routes.js';
import customOrderRouter from './routes/customOrder.routes.js';
import couponRouter from './routes/coupon.routes.js';
import notificationRouter from './routes/notification.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app = express();

connectCloudinary();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve('uploads')));

app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/order', orderRouter);
app.use('/api/note', noteRouter);
app.use('/api/custom-order', customOrderRouter);
app.use('/api/coupon', couponRouter);
app.use('/api/notification', notificationRouter);

app.get('/', (_req, res) => {
  res.send('API working');
});

app.use(notFound);
app.use(errorHandler);

export default app;