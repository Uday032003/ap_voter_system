import express from 'express';
import { dbService } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleGuard.js';

const router = express.Router();

router.use(authMiddleware, requireRoles('super_admin'));

// GET /api/admin/dashboard-stats
// Returns real database statistics for Super Admin dashboard:
// Configured districts, Assembly constituencies, MPTC village constituencies,
// Total imported voter records, Recent imports, Pending Leader access requests, Import failures.
router.get('/dashboard-stats', async (req, res, next) => {
  try {
    const stats = await dbService.getAdminDashboardStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
});

export default router;
