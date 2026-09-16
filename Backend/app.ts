import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import connectCloudinary from './config/database.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app = express();

connectCloudinary();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve('uploads')));

app.use('/api', routes);

app.get('/', (_req, res) => {
  res.send('API working');
});

app.use(notFound);
app.use(errorHandler);

export default app;