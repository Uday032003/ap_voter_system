import express from 'express';
import { dbService } from '../services/dbService.js';

const router = express.Router();

// GET /api/public/voters
// Commoner public directory: ONLY is_public_approved = true records
// Sensitive identifiers are filtered out
router.get('/voters', async (req, res, next) => {
  try {
    const {
      constituencyId,
      partNumber,
      search,
      page = 1,
      limit = 25
    } = req.query;

    const result = await dbService.queryVoters({
      constituencyId,
      partNumber,
      search,
      isPublicApprovedOnly: true,
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 25, 50)
    });

    const sanitizedRecords = result.records.map(v => ({
      id: v.id,
      serial_number: v.serial_number,
      part_number: v.part_number,
      name_en: v.name_en,
      name_te: v.name_te,
      relative_type: v.relative_type,
      relative_name_en: v.relative_name_en,
      relative_name_te: v.relative_name_te,
      house_number: v.house_number,
      gender: v.gender,
      age: v.age
    }));

    res.json({
      success: true,
      records: sanitizedRecords,
      totalCount: result.totalCount,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasMore: result.hasMore
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/constituency-info/:id
router.get('/constituency-info/:id', async (req, res, next) => {
  try {
    const c = await dbService.getConstituencyById(req.params.id);
    if (!c) {
      return res.status(404).json({ success: false, message: 'Constituency not found' });
    }
    res.json({
      success: true,
      data: c
    });
  } catch (err) {
    next(err);
  }
});

export default router;
