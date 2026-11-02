import express from 'express';
import { z } from 'zod';
import { dbService } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleGuard.js';

const router = express.Router();

// POST /api/access-requests (Leader submits request for MPTC constituency access)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const schema = z.object({
      mptc_village_constituency_id: z.string().optional(),
      constituency_id: z.string().optional(),
      justification: z.string().min(3)
    });

    const data = schema.parse(req.body);
    const mptcId = data.mptc_village_constituency_id || data.constituency_id;

    if (!mptcId) {
      return res.status(400).json({ success: false, message: 'MPTC Village Constituency ID is required.' });
    }

    const newRequest = await dbService.submitAccessRequest({
      leaderId: req.user.id,
      mptcConstituencyId: mptcId,
      justification: data.justification
    });

    await dbService.logAudit({
      userId: req.user.id,
      action: 'SUBMIT_ACCESS_REQUEST',
      entityType: 'ACCESS_REQUEST',
      entityId: newRequest.id,
      details: { mptc_village_constituency_id: mptcId }
    });

    res.status(201).json({
      success: true,
      message: 'Access request submitted successfully for Super Admin approval.',
      data: newRequest
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/access-requests (Super Admin views all; Leader views own)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const requests = await dbService.getAccessRequests(req.user.id, req.user.role);
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

// PUT /api/access-requests/:id/approve (Super Admin only)
router.put('/:id/approve', authMiddleware, requireRoles('super_admin'), async (req, res, next) => {
  try {
    const { review_notes } = req.body || {};
    const updated = await dbService.approveAccessRequest(req.params.id, req.user.id, review_notes);

    await dbService.logAudit({
      userId: req.user.id,
      action: 'APPROVE_ACCESS_REQUEST',
      entityType: 'ACCESS_REQUEST',
      entityId: req.params.id,
      details: { review_notes }
    });

    res.json({
      success: true,
      message: 'Access request approved. Leader constituency permissions granted.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/access-requests/:id/reject (Super Admin only)
router.put('/:id/reject', authMiddleware, requireRoles('super_admin'), async (req, res, next) => {
  try {
    const { review_notes } = req.body || {};
    const updated = await dbService.rejectAccessRequest(req.params.id, req.user.id, review_notes);

    await dbService.logAudit({
      userId: req.user.id,
      action: 'REJECT_ACCESS_REQUEST',
      entityType: 'ACCESS_REQUEST',
      entityId: req.params.id,
      details: { reason: review_notes }
    });

    res.json({
      success: true,
      message: 'Access request rejected.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/access-requests/revoke (Super Admin revokes existing access)
router.post('/revoke', authMiddleware, requireRoles('super_admin'), async (req, res, next) => {
  try {
    const schema = z.object({
      leader_id: z.string().min(1),
      mptc_village_constituency_id: z.string().min(1)
    });
    const { leader_id, mptc_village_constituency_id } = schema.parse(req.body);

    const result = await dbService.revokeLeaderAccess(leader_id, mptc_village_constituency_id, req.user.id);

    await dbService.logAudit({
      userId: req.user.id,
      action: 'REVOKE_LEADER_ACCESS',
      entityType: 'LEADER_CONSTITUENCY_ACCESS',
      details: { leader_id, mptc_village_constituency_id }
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
