import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { supabaseClient } from '../config/supabase.js';
import { dbService } from '../services/dbService.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No session token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // 1. If Supabase configured, attempt Supabase auth verification
    if (ENV.IS_SUPABASE_CONFIGURED && supabaseClient) {
      try {
        const { data: { user }, error } = await supabaseClient.auth.getUser(token);
        if (!error && user) {
          const profile = await dbService.getProfileByEmail(user.email);
          if (!profile || !profile.is_active) {
            return res.status(403).json({
              success: false,
              message: 'User account is inactive or not found.'
            });
          }
          req.user = profile;
          return next();
        }
      } catch (e) {
        // Continue to JWT verification
      }
    }

    // 2. JWT verification
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const profile = await dbService.getProfileById(decoded.id) || await dbService.getProfileByEmail(decoded.email);

      if (!profile || !profile.is_active) {
        return res.status(403).json({
          success: false,
          message: 'User account is inactive or revoked.'
        });
      }

      req.user = profile;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please sign in again.'
      });
    }
  } catch (error) {
    next(error);
  }
}

// Optional Auth (e.g. for commoners or public directory endpoints)
export async function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  return authMiddleware(req, res, next);
}
