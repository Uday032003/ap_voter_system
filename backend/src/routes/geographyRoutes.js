import express from 'express';
import { z } from 'zod';
import { dbService } from '../services/dbService.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/geography/districts
// Returns active districts in Andhra Pradesh
router.get('/districts', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const districts = await dbService.getDistricts();
    res.json({ success: true, data: districts });
  } catch (err) {
    next(err);
  }
});

// GET /api/geography/assemblies (Assembly Constituencies under District)
router.get('/assemblies', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { district_id } = req.query;
    const list = await dbService.getAssemblyConstituencies(district_id);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

// GET /api/geography/mptcs (MPTC Village Constituencies under Assembly)
router.get('/mptcs', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { assembly_id, district_id } = req.query;
    const list = await dbService.getMptcConstituencies(assembly_id, district_id);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

// Backward compatibility alias: /api/geography/mandals & /api/geography/villages
router.get('/mandals', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { district_id } = req.query;
    const list = await dbService.getAssemblyConstituencies(district_id);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.get('/villages', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { mandal_id } = req.query;
    const list = await dbService.getMptcConstituencies(mandal_id);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

// GET /api/geography/user-selection
// Loads the authenticated user's persisted constituency selection
router.get('/user-selection', authMiddleware, async (req, res, next) => {
  try {
    const selection = await dbService.getUserConstituencySelection(req.user.id);
    res.json({ success: true, data: selection });
  } catch (err) {
    next(err);
  }
});

// POST /api/geography/user-selection
// Saves or updates the user's constituency selection (State -> District -> Assembly -> MPTC Village)
router.post('/user-selection', authMiddleware, async (req, res, next) => {
  try {
    const schema = z.object({
      mptc_village_constituency_id: z.string().min(1)
    });
    const { mptc_village_constituency_id } = schema.parse(req.body);

    const saved = await dbService.saveUserConstituencySelection(req.user.id, mptc_village_constituency_id);
    const fullSelection = await dbService.getUserConstituencySelection(req.user.id);

    res.json({
      success: true,
      message: 'Constituency selection saved successfully.',
      data: fullSelection || saved
    });
  } catch (err) {
    next(err);
  }
});

export default router;
