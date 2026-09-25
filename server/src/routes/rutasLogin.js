import { Router } from 'express'
import { login, forgotPassword, resetPassword, googleAuth } from '../controllers/authController.js'
import {
  loginRateLimiter,
  passwordRecoveryRateLimiter
} from '../middleware/authRateLimiter.js';

const router = Router()

router.post('/login', loginRateLimiter, login);

router.post(
  '/forgot-password',
  passwordRecoveryRateLimiter,
  forgotPassword
);

router.post(
  '/reset-password',
  passwordRecoveryRateLimiter,
  resetPassword
);


router.post('/google', loginRateLimiter, googleAuth);

export default router