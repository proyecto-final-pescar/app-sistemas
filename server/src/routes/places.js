// server/src/routes/places.js

import { Router } from 'express';
import { autocomplete, details } from '../controllers/placesController.js';

const router = Router();

router.get('/autocomplete', autocomplete);
router.get('/details', details);

export default router;