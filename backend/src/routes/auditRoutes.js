import express from 'express';
import { supabaseAdmin, supabaseClient } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleGuard.js';

const router = express.Router();

// GET /api/audit-logs (Super Admin only)
router.get('/', authMiddleware, requireRoles('super_admin'), async (req, res, next) => {
  try {
    const client = supabaseAdmin || supabaseClient;
    const { action, entityType, limit = 100 } = req.query;

    let query = client
      .from('audit_logs')
      .select(`
        *,
        user:user_id (email, full_name_en)
      `)
      .order('created_at', { ascending: false })
      .limit(Number(limit) || 100);

    if (action) {
      query = query.ilike('action', `%${action}%`);
    }
    if (entityType) {
      query = query.ilike('entity_type', `%${entityType}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const enriched = (data || []).map(l => ({
      ...l,
      user_email: l.user?.email || 'System',
      user_name: l.user?.full_name_en || 'System'
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

export default router;
