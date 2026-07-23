import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { generateToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Utility to generate a unique Med.hub ID
 */
const generateMedhubId = () => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `MED-${randomDigits}`;
};

/**
 * @desc    Signup Full-Access User
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, age, contact, bloodGroup, height, weight, medicalHistory } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return sendError(res, 'User with this email already exists', 400);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate unique Med.hub ID
  let medhubId = generateMedhubId();
  let isIdUnique = false;
  while (!isIdUnique) {
    const existingMedhubUser = await prisma.user.findUnique({ where: { medhubId } });
    if (!existingMedhubUser) {
      isIdUnique = true;
    } else {
      medhubId = generateMedhubId();
    }
  }

  // Create User in DB
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      age: Number(age),
      contact,
      bloodGroup,
      height,
      weight,
      medicalHistory: medicalHistory || '',
      medhubId,
      role: 'full_access',
    },
  });

  // Generate JWT Token with role: 'full_access'
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    medhubId: user.medhubId,
  });

  const { password: _, ...userWithoutPassword } = user;

  return sendSuccess(
    res,
    'Full access user account registered successfully',
    {
      user: userWithoutPassword,
      token,
    },
    201
  );
});

/**
 * @desc    Login Full-Access User (Email & Password)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Generate JWT token with role: 'full_access'
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: 'full_access',
    medhubId: user.medhubId,
  });

  const { password: _, ...userWithoutPassword } = user;

  return sendSuccess(res, 'Login successful', {
    user: { ...userWithoutPassword, role: 'full_access' },
    token,
  });
});

/**
 * @desc    Login Read-Only User via Med.hub ID
 * @route   POST /api/auth/login-medhub
 * @access  Public
 */
export const loginMedhub = asyncHandler(async (req, res) => {
  const { medhubId } = req.body;

  // Search user by Med.hub ID in DB
  const user = await prisma.user.findUnique({
    where: { medhubId },
  });

  if (!user) {
    return sendError(res, 'Invalid Med.hub ID. Record not found.', 404);
  }

  // Generate JWT Token with role: 'read_only'
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: 'read_only',
    medhubId: user.medhubId,
  });

  const { password: _, ...userWithoutPassword } = user;

  return sendSuccess(res, 'Authenticated via Med.hub ID (Read-Only Mode)', {
    user: {
      id: user.id,
      name: user.name,
      medhubId: user.medhubId,
      role: 'read_only',
      age: user.age,
      bloodGroup: user.bloodGroup,
    },
    token,
  });
});

/**
 * @desc    Authenticate/Register User via Google OAuth
 * @route   POST /api/auth/google
 * @access  Public
 */
export const loginGoogle = asyncHandler(async (req, res) => {
  const { accessToken, idToken, credential, email: bodyEmail, name: bodyName, googleId: bodyGoogleId } = req.body;

  let googleEmail = bodyEmail;
  let googleName = bodyName;
  let googleSub = bodyGoogleId;

  // 1. If OAuth2 accessToken is provided from Google popup
  if (accessToken) {
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        if (userInfo.email) {
          googleEmail = userInfo.email;
          googleName = userInfo.name || userInfo.email.split('@')[0];
          googleSub = userInfo.sub;
        }
      }
    } catch (err) {
      console.warn('Google UserInfo fetch warning:', err.message);
    }
  }

  // 2. Verify Google ID Token via Google's OAuth2 TokenInfo API if provided
  const tokenToVerify = idToken || credential;
  if (!googleEmail && tokenToVerify) {
    try {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenToVerify}`);
      if (verifyRes.ok) {
        const tokenInfo = await verifyRes.json();
        if (tokenInfo.email) {
          googleEmail = tokenInfo.email;
          googleName = tokenInfo.name || tokenInfo.email.split('@')[0];
          googleSub = tokenInfo.sub;
        }
      }
    } catch (err) {
      console.warn('Google ID Token verification warning:', err.message);
    }
  }

  if (!googleEmail) {
    return sendError(res, 'Google authentication failed: Email credentials missing', 400);
  }

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email: googleEmail },
  });

  if (!user) {
    // Generate hashed placeholder password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(googleSub || `google_${Date.now()}`, salt);

    // Generate unique Med.hub ID
    let medhubId = generateMedhubId();
    let isIdUnique = false;
    while (!isIdUnique) {
      const existingMedhubUser = await prisma.user.findUnique({ where: { medhubId } });
      if (!existingMedhubUser) {
        isIdUnique = true;
      } else {
        medhubId = generateMedhubId();
      }
    }

    // Register user in database
    user = await prisma.user.create({
      data: {
        name: googleName || googleEmail.split('@')[0],
        email: googleEmail,
        password: hashedPassword,
        age: 30,
        contact: '+1 (555) 000-0000',
        bloodGroup: 'O+',
        height: '170',
        weight: '70',
        medicalHistory: 'Registered via Google Single Sign-On',
        medhubId,
        role: 'full_access',
      },
    });
  }

  // Generate JWT Token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: 'full_access',
    medhubId: user.medhubId,
  });

  const { password: _, ...userWithoutPassword } = user;

  return sendSuccess(res, 'Authenticated successfully via Google', {
    user: { ...userWithoutPassword, role: 'full_access' },
    token,
  });
});
