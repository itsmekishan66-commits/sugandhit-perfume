import { Router } from 'express';
import { adminAuth } from '../../middleware/permission.middleware.js';
import { saveNotes, saveBases, saveSizes, saveBottleTypes, saveSettings } from './customization.controller.js';

const router = Router();

router.put('/notes/:layer', adminAuth, saveNotes);
router.put('/bases', adminAuth, saveBases);
router.put('/sizes', adminAuth, saveSizes);
router.put('/bottletypes', adminAuth, saveBottleTypes);
router.put('/settings', adminAuth, saveSettings);

export default router;