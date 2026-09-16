import { Router } from 'express';
import { adminAuth } from '../../middleware/permission.middleware.js';
import { getPalette, seedPaletteController } from './notes.controller.js';

const router = Router();

router.get('/palette', getPalette);
router.post('/seed', adminAuth, seedPaletteController);

export default router;