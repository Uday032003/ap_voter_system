import express from 'express';
import { z } from 'zod';
import { dbService } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleGuard.js';

const router = express.Router();

// GET /api/voters
// Query params: constituencyId, partNumber, search, gender, minAge, maxAge, page, limit
router.get('/', authMiddleware, requireRoles('super_admin', 'leader', 'commoner'), async (req, res, next) => {
  try {
    const {
      constituencyId,
      partNumber,
      search,
      gender,
      minAge,
      maxAge,
      page = 1,
      limit = 25
    } = req.query;

    let targetConstituencyId = constituencyId;

    // Commoner: default to saved constituency selection if not provided
    if (req.user.role === 'commoner' && !targetConstituencyId) {
      const selection = await dbService.getUserConstituencySelection(req.user.id);
      targetConstituencyId = selection?.mptc_village_constituency_id || null;
    }

    // Leader: must have approved access to the target constituency
    if (req.user.role === 'leader') {
      if (!targetConstituencyId) {
        const approved = await dbService.getLeaderApprovedConstituencies(req.user.id);
        targetConstituencyId = approved[0]?.id || null;
      }
      if (targetConstituencyId) {
        const hasAccess = await dbService.hasLeaderConstituencyAccess(req.user.id, targetConstituencyId);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Unauthorized: You do not have approved active access to this constituency.'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'No approved constituency access. Please submit an access request.'
        });
      }
    }

    const result = await dbService.queryVoters({
      constituencyId: targetConstituencyId,
      partNumber,
      search,
      gender,
      minAge,
      maxAge,
      isPublicApprovedOnly: req.user.role === 'commoner',
      leaderId: req.user.role === 'leader' ? req.user.id : null,
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

// GET /api/voters/:id
router.get('/:id', authMiddleware, requireRoles('super_admin', 'leader', 'commoner'), async (req, res, next) => {
  try {
    const voter = await dbService.getVoterById(req.params.id, req.user.role === 'leader' ? req.user.id : null);
    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter record not found.' });
    }

    if (req.user.role === 'leader') {
      const hasAccess = await dbService.hasLeaderConstituencyAccess(req.user.id, voter.mptc_village_constituency_id);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: Record belongs to an unauthorized constituency.'
        });
      }
    }

    res.json({
      success: true,
      data: voter
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/voters/:id (Super Admin editing master voter record)
router.put('/:id', authMiddleware, requireRoles('super_admin'), async (req, res, next) => {
  try {
    const voter = await dbService.getVoterById(req.params.id);
    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter record not found.' });
    }

    const schema = z.object({
      name_en: z.string().min(1).optional(),
      name_te: z.string().optional(),
      relative_type: z.string().optional(),
      relative_name_en: z.string().optional(),
      relative_name_te: z.string().optional(),
      house_number: z.string().optional(),
      age: z.number().int().min(18).max(130).optional(),
      gender: z.enum(['M', 'F', 'O', 'Male', 'Female', 'Other']).optional(),
      part_number: z.string().optional(),
      voter_id: z.string().optional(),
      serial_number: z.number().int().optional(),
      section_name_en: z.string().optional().nullable(),
      section_name_te: z.string().optional().nullable()
    });

    const updates = schema.parse(req.body);
    const updated = await dbService.updateVoter(voter.id, updates);

    await dbService.logAudit({
      userId: req.user.id,
      action: 'UPDATE_MASTER_VOTER',
      entityType: 'VOTER',
      entityId: voter.id,
      details: updates
    });

    res.json({
      success: true,
      message: 'Voter record updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/voters/:id/mark (Leader Add Voter to My List)
router.post('/:id/mark', authMiddleware, requireRoles('leader', 'super_admin'), async (req, res, next) => {
  try {
    const voterId = req.params.id;
    const { notes } = req.body || {};

    const result = await dbService.addVoterToList(req.user.id, voterId, notes);

    await dbService.logAudit({
      userId: req.user.id,
      action: 'ADD_VOTER_TO_LIST',
      entityType: 'LEADER_ADDED_VOTER',
      entityId: voterId
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/voters/:id/mark (Leader Remove Voter from My List)
router.delete('/:id/mark', authMiddleware, requireRoles('leader', 'super_admin'), async (req, res, next) => {
  try {
    const voterId = req.params.id;
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
