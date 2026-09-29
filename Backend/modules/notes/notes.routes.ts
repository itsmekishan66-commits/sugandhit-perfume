import { Router } from 'express';
import { adminAuth } from '../../middleware/permission.middleware.js';
import { getPalette, getPaletteTable, seedPaletteController } from './notes.controller.js';

const router = Router();

router.get('/palette', getPalette);
/** Single-table variant: /palette/table?table=bases */
router.get('/palette/table', getPaletteTable);
router.post('/seed', adminAuth, seedPaletteController);

export default router;