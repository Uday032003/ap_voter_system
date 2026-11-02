import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { dbService } from '../services/dbService.js';
import { ENV } from '../config/env.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name_en: z.string().min(2),
  full_name_te: z.string().optional(),
  phone: z.string().optional()
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const profile = await dbService.getProfileByEmail(email);

    if (!profile) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User account not found.'
      });
    }

    if (!profile.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator.'
      });
    }

    if (profile.password_hash) {
      const isValid = await bcrypt.compare(password, profile.password_hash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Password incorrect.'
        });
      }
    }

    const token = jwt.sign(
      {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name_en: profile.full_name_en
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );

    const approvedConstituencies = profile.role === 'leader'
      ? await dbService.getLeaderApprovedConstituencies(profile.id)
      : (profile.role === 'super_admin' ? await dbService.getConstituencies() : []);

    await dbService.logAudit({
      userId: profile.id,
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      entityId: profile.id,
      details: { email: profile.email, role: profile.role }
    });

    res.json({
      success: true,
      token,
      user: {
        id: profile.id,
        email: profile.email,
        full_name_en: profile.full_name_en,
        full_name_te: profile.full_name_te,
        role: profile.role,
        phone: profile.phone,
        approvedConstituencies
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register (Registers standard citizen/commoner)
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await dbService.getProfileByEmail(data.email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    const newProfile = await dbService.createProfile({
      email: data.email.toLowerCase(),
      password_hash,
      full_name_en: data.full_name_en,
      full_name_te: data.full_name_te || data.full_name_en,
      role: 'commoner',
      phone: data.phone || '',
      is_active: true
    });

    const token = jwt.sign(
      {
        id: newProfile.id,
        email: newProfile.email,
        role: newProfile.role,
        full_name_en: newProfile.full_name_en
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: newProfile.id,
        email: newProfile.email,
        full_name_en: newProfile.full_name_en,
        full_name_te: newProfile.full_name_te,
        role: newProfile.role,
        phone: newProfile.phone,
        approvedConstituencies: []
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const profile = req.user;
    const approvedConstituencies = profile.role === 'leader'
      ? await dbService.getLeaderApprovedConstituencies(profile.id)
      : (profile.role === 'super_admin' ? await dbService.getConstituencies() : []);

    res.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        full_name_en: profile.full_name_en,
        full_name_te: profile.full_name_te,
        role: profile.role,
        phone: profile.phone,
        approvedConstituencies
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
