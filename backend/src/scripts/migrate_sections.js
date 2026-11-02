import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';

async function migrateSectionsFast() {
  console.log('--- Fast Migrating Sections to voters ---');

  try {
    // 1. Add columns to voters
    await pool.query(`
      ALTER TABLE voters 
      ADD COLUMN IF NOT EXISTS section_name_en VARCHAR(255),
      ADD COLUMN IF NOT EXISTS section_name_te VARCHAR(255);
    `);
    console.log('Columns verified on voters table.');

    // 2. Read all bilingual CSVs from artifacts folder
    const artifactsDir = 'C:/Users/polim/.gemini/antigravity/brain/552a4df5-a8a5-4bf3-8256-dada8dc92713';
    const files = fs.readdirSync(artifactsDir).filter(f => f.startsWith('bilingual_voters_part'));

    const voterIds = [];
    const secEns = [];
    const secTes = [];

    for (const f of files) {
      const filePath = path.join(artifactsDir, f);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      if (lines.length < 2) continue;

      const header = lines[0].replace(/^\uFEFF/, '').trim().split(',');
      const vidIdx = header.indexOf('voter_id');
      const secEnIdx = header.indexOf('section_name_en');
      const secTeIdx = header.indexOf('section_name_te');

      if (vidIdx === -1 || secEnIdx === -1) continue;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        const voterId = (cols[vidIdx] || '').trim();
        const secEn = (cols[secEnIdx] || '').trim();
        const secTe = secTeIdx > -1 ? (cols[secTeIdx] || '').trim() : '';

        if (voterId && secEn) {
          voterIds.push(voterId);
          secEns.push(secEn);
          secTes.push(secTe || secEn);
        }
      }
    }

    console.log(`Parsed ${voterIds.length} voter sections from CSVs. Executing batch update...`);

    // Batch update in chunks of 500
    const chunkSize = 500;
    for (let i = 0; i < voterIds.length; i += chunkSize) {
      const chunkVids = voterIds.slice(i, i + chunkSize);
      const chunkEns = secEns.slice(i, i + chunkSize);
      const chunkTes = secTes.slice(i, i + chunkSize);

      await pool.query(`
        UPDATE voters v
        SET section_name_en = d.sec_en, section_name_te = d.sec_te
        FROM (
          SELECT unnest($1::text[]) as vid, unnest($2::text[]) as sec_en, unnest($3::text[]) as sec_te
        ) d
        WHERE v.voter_id = d.vid;
      `, [chunkVids, chunkEns, chunkTes]);
    }

    console.log('Batch update complete!');

    // Update view if voter_records is a view
    try {
      await pool.query(`
        CREATE OR REPLACE VIEW voter_records AS 
        SELECT 
          id,
          mptc_village_constituency_id,
          mptc_village_constituency_id AS constituency_id,
          part_number AS part_id,
          part_number,
          serial_number,
          voter_id,
          voter_id AS epic_number_masked,
          name_en,
          name_te,
          relative_type,
          relative_name_en,
          relative_name_te,
          house_number,
          house_number AS house_number_en,
          house_number AS house_number_te,
          age,
          gender,
          section_name_en,
          section_name_te,
          is_public_approved,
          'approved'::text AS review_status,
          'General'::text AS admin_tag,
          created_at,
          updated_at
        FROM voters;
      `);
      console.log('voter_records view updated successfully.');
    } catch (e) {
      console.warn('View update notice:', e.message);
    }

    // Verify sections in database
    const verify = await pool.query(`
      SELECT section_name_en, COUNT(*) as count 
      FROM voters 
      WHERE section_name_en IS NOT NULL 
      GROUP BY section_name_en 
      ORDER BY count DESC
    `);
    console.log('Distinct sections in DB:', verify.rows);

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrateSectionsFast();
