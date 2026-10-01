import { Router } from 'express';
import { adminAuth } from '../../middleware/permission.middleware.js';
import { getSettings, updateSettings } from './settings.controller.js';

const router = Router();

router.get('/', getSettings);
router.put('/', adminAuth, updateSettings);

export default router;