// server/src/routes/places.js

import { Router } from 'express';
import { autocomplete, details } from '../controllers/placesController.js';
import placesRateLimiter from '../middleware/placesRateLimiter.js';

const router = Router();

router.get('/autocomplete', placesRateLimiter, autocomplete);
router.get('/details', placesRateLimiter, details);

export default router;
