import express from 'express';
import { seed, getPalette } from '../controllers/note.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

const noteRouter = express.Router();

noteRouter.get('/palette', getPalette);
noteRouter.post('/seed', adminAuth, seed);

export default noteRouter;