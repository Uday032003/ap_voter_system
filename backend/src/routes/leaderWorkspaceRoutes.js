import express from 'express';
import { z } from 'zod';
import { dbService } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleGuard.js';

const router = express.Router();

// All routes require Leader or Super Admin
router.use(authMiddleware, requireRoles('leader', 'super_admin'));

// GET /api/leader/dashboard-stats
// Returns real database statistics for the Leader
router.get('/dashboard-stats', async (req, res, next) => {
  try {
    const { constituencyId } = req.query;
    const stats = await dbService.getLeaderDashboardStats(req.user.id, constituencyId);
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/leader/added-voters (and alias /marked-voters)
// Retrieves voters added to the Leader's administrative list
router.get(['/added-voters', '/marked-voters'], async (req, res, next) => {
  try {
    const {
      constituencyId,
      search,
      partNumber,
      gender,
      page = 1,
      limit = 25
    } = req.query;

    const result = await dbService.getAddedVoters({
      leaderId: req.user.id,
      constituencyId,
      search,
      partNumber,
      gender,
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 25, 100)
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/leader/added-voters (and alias /marks)
// Add voter to Leader's administrative follow-up list
router.post(['/added-voters', '/marks'], async (req, res, next) => {
  try {
    const schema = z.object({
      voter_id: z.string().min(1),
      notes: z.string().nullable().optional()
    });

    const { voter_id, notes } = schema.parse(req.body);
    const result = await dbService.addVoterToList(req.user.id, voter_id, notes);

    await dbService.logAudit({
      userId: req.user.id,
      action: 'ADD_VOTER_TO_LIST',
      entityType: 'LEADER_ADDED_VOTER',
      entityId: voter_id
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/leader/added-voters/:voterId (and alias /marks/:voterId)
// Remove voter from Leader's list
router.delete(['/added-voters/:voterId', '/marks/:voterId'], async (req, res, next) => {
  try {
    const { voterId } = req.params;
    const result = await dbService.removeVoterFromList(req.user.id, voterId);

    await dbService.logAudit({
      userId: req.user.id,
      action: 'REMOVE_VOTER_FROM_LIST',
      entityType: 'LEADER_ADDED_VOTER',
      entityId: voterId
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
