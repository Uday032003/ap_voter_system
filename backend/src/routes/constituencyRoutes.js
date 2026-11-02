import express from 'express';
import { z } from 'zod';
import { dbService } from '../services/dbService.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleGuard.js';

const router = express.Router();

// GET /api/constituencies
// Returns list of MPTC village constituencies
router.get('/', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const { assembly_id, district_id } = req.query;
    const list = await dbService.getMptcConstituencies(assembly_id, district_id);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

// GET /api/constituencies/hierarchy
// Full hierarchical tree: State -> Districts -> Assemblies -> MPTC Villages
router.get('/hierarchy', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const tree = await dbService.getFullHierarchyTree();
    res.json({ success: true, data: tree });
  } catch (err) {
    next(err);
  }
});

// GET /api/constituencies/:id
router.get('/:id', optionalAuthMiddleware, async (req, res, next) => {
  try {
    const constituency = await dbService.getConstituencyById(req.params.id);
    if (!constituency) {
      return res.status(404).json({ success: false, message: 'Constituency not found.' });
    }
    res.json({ success: true, data: constituency });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// SUPER ADMIN CONSTITUENCY MANAGEMENT
// ==========================================

// POST /api/constituencies/districts
router.post('/districts', authMiddleware, requireRoles('super_admin'), async (req, res, next) => {
  try {
    const schema = z.object({
      code: z.string().min(2),
      name_en: z.string().min(2),
      name_te: z.string().optional()
    });
    const data = schema.parse(req.body);
    const created = await dbService.createDistrict(data);

    await dbService.logAudit({
      userId: req.user.id,
      action: 'CREATE_DISTRICT',
      entityType: 'DISTRICT',
      entityId: created.id,
      details: data
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// PUT /api/constituencies/districts/:id
router.put('/districts/:id', authMiddleware, requireRoles('super_admin'), async (req, res, next) => {
  try {
    const schema = z.object({
      name_en: z.string().optional(),
      name_te: z.string().optional(),
      is_active: z.boolean().optional()
    });
    const data = schema.parse(req.body);
    const updated = await dbService.updateDistrict(req.params.id, data);

    await dbService.logAudit({
      userId: req.user.id,
      action: 'UPDATE_DISTRICT',
      entityType: 'DISTRICT',
      entityId: req.params.id,
      details: data
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/constituencies/assemblies
router.post('/assemblies', authMiddleware, requireRoles('super_admin'), async (req, res, next) => {
  try {
    const schema = z.object({
      district_id: z.string().min(1),
      code: z.string().min(2),
      name_en: z.string().min(2),
      name_te: z.string().optional()
    });
    const data = schema.parse(req.body);
    const created = await dbService.createAssemblyConstituency(data);

    await dbService.logAudit({
      userId: req.user.id,
      action: 'CREATE_ASSEMBLY',
      entityType: 'ASSEMBLY_CONSTITUENCY',
      entityId: created.id,
      details: data
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// PUT /api/constituencies/assemblies/:id
router.put('/assemblies/:id', authMiddleware, requireRoles('super_admin'), async (req, res, next) => {
  try {
    const schema = z.object({
      name_en: z.string().optional(),
      name_te: z.string().optional(),
      is_active: z.boolean().optional()
    });
    const data = schema.parse(req.body);
    const updated = await dbService.updateAssemblyConstituency(req.params.id, data);

    await dbService.logAudit({
      userId: req.user.id,
      action: 'UPDATE_ASSEMBLY',
      entityType: 'ASSEMBLY_CONSTITUENCY',
      entityId: req.params.id,
      details: data
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/constituencies/mptcs
router.post('/mptcs', authMiddleware, requireRoles('super_admin'), async (req, res, next) => {
  try {
    const schema = z.object({
      assembly_constituency_id: z.string().min(1),
      code: z.string().min(2),
      name_en: z.string().min(2),
      name_te: z.string().optional(),
      total_electors: z.number().int().optional()
    });
    const data = schema.parse(req.body);
    const created = await dbService.createMptcConstituency(data);

    await dbService.logAudit({
      userId: req.user.id,
      action: 'CREATE_MPTC',
      entityType: 'MPTC_CONSTITUENCY',
      entityId: created.id,
      details: data
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// PUT /api/constituencies/mptcs/:id
router.put('/mptcs/:id', authMiddleware, requireRoles('super_admin'), async (req, res, next) => {
  try {
    const schema = z.object({
      name_en: z.string().optional(),
      name_te: z.string().optional(),
      total_electors: z.number().int().optional(),
      is_active: z.boolean().optional()
    });
    const data = schema.parse(req.body);
    const updated = await dbService.updateMptcConstituency(req.params.id, data);

    await dbService.logAudit({
      userId: req.user.id,
      action: 'UPDATE_MPTC',
      entityType: 'MPTC_CONSTITUENCY',
      entityId: req.params.id,
      details: data
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
