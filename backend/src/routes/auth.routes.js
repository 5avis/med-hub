import { Router } from 'express';
import { signup, login, loginMedhub, loginGoogle } from '../controllers/auth.controller.js';
import { validate, signupSchema, loginSchema, medhubLoginSchema } from '../middleware/validate.middleware.js';

const router = Router();

/**
 * @route POST /api/auth/signup
 * @desc  Register a new full-access user
 */
router.post('/signup', validate(signupSchema), signup);

/**
 * @route POST /api/auth/login
 * @desc  Authenticate full-access user with Email & Password
 */
router.post('/login', validate(loginSchema), login);

/**
 * @route POST /api/auth/login-medhub & POST /api/auth/medhub-login
 * @desc  Authenticate read-only user with Med.hub ID
 */
router.post('/login-medhub', validate(medhubLoginSchema), loginMedhub);
router.post('/medhub-login', validate(medhubLoginSchema), loginMedhub);

/**
 * @route POST /api/auth/google
 * @desc  Authenticate or register user via Google Single Sign-On
 */
router.post('/google', loginGoogle);

export default router;
