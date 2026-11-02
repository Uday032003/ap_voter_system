import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { dbService } from '../services/dbService.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleGuard.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// All import routes are strictly Super Admin only
router.use(authMiddleware, requireRoles('super_admin'));

// POST /api/imports/validate
// Step 1: Upload CSV -> Validate -> Detect duplicates & invalid rows -> Show summary
router.post('/validate', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please provide a CSV file.' });
    }

    const { mptc_village_constituency_id } = req.body;
    if (!mptc_village_constituency_id) {
      return res.status(400).json({ success: false, message: 'MPTC Village Constituency must be selected.' });
    }

    const constituency = await dbService.getConstituencyById(mptc_village_constituency_id);
    if (!constituency) {
      return res.status(404).json({ success: false, message: 'Selected constituency does not exist.' });
    }

    const csvContent = req.file.buffer.toString('utf8');
    let parsedRows = [];
    try {
      parsedRows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      });
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        message: `Failed to parse CSV file: ${parseErr.message}. Ensure UTF-8 encoding and valid CSV syntax.`
      });
    }

    if (parsedRows.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded CSV file is empty.' });
    }

    const validationResult = await dbService.validateCsvRows(mptc_village_constituency_id, parsedRows);

    res.json({
      success: true,
      data: {
        fileName: req.file.originalname,
        constituencyId: mptc_village_constituency_id,
        constituencyNameEn: constituency.name_en,
        constituencyNameTe: constituency.name_te,
        ...validationResult
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/imports/confirm
// Step 2: Confirm import -> Save records to Supabase -> Record in voter_imports & import_errors
router.post('/confirm', async (req, res, next) => {
  try {
    const { mptc_village_constituency_id, fileName, validRows, duplicates, invalidRows } = req.body;

    if (!mptc_village_constituency_id || !validRows || !Array.isArray(validRows)) {
      return res.status(400).json({ success: false, message: 'Invalid payload for import confirmation.' });
    }

    const result = await dbService.commitVoterImport({
      uploadedBy: req.user.id,
      mptcConstituencyId: mptc_village_constituency_id,
      fileName: fileName || 'import.csv',
      validRows,
      duplicates: duplicates || [],
      invalidRows: invalidRows || []
    });

    await dbService.logAudit({
      userId: req.user.id,
      action: 'VOTER_CSV_IMPORT',
      entityType: 'VOTER_IMPORT',
      entityId: result.importId,
      details: {
        totalRows: result.totalRows,
        insertedCount: result.insertedCount,
        skippedCount: result.skippedCount,
        failedCount: result.failedCount
      }
    });

    res.json({
      success: true,
      message: `Import processed successfully: ${result.insertedCount} inserted, ${result.skippedCount} skipped duplicates, ${result.failedCount} invalid rows.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/imports/history
// Retrieves real import history from Supabase
router.get('/history', async (req, res, next) => {
  try {
    const history = await dbService.getImportHistory();
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

// GET /api/imports/errors/:id
router.get('/errors/:id', async (req, res, next) => {
  try {
    const errors = await dbService.getImportErrors(req.params.id);
    res.json({ success: true, data: errors });
  } catch (err) {
    next(err);
  }
});

export default router;
