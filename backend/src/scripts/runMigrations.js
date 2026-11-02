import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  if (!pool) {
    console.error('DATABASE_URL is not configured in .env');
    process.exit(1);
  }

  const candidateDirs = [
    path.resolve(__dirname, '../../database/migrations'),
    path.resolve(process.cwd(), 'backend/database/migrations'),
    path.resolve(process.cwd(), 'database/migrations'),
    path.resolve(__dirname, '../../../database/migrations'),
    path.resolve(process.cwd(), '../database/migrations')
  ];
  const migrationsDir = candidateDirs.find(d => fs.existsSync(d));
  if (!migrationsDir) {
    console.error('Could not locate database/migrations directory');
    process.exit(1);
  }
  const files = [
    '07_party_free_and_constituency_hierarchy.sql'
  ];

  console.log('Connecting to PostgreSQL database...');
  const client = await pool.connect();

  try {
    console.log('Beginning migration execution...');
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`File ${file} not found, skipping.`);
        continue;
      }
      console.log(`Running migration: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      console.log(`✔ Completed: ${file}`);
    }
    console.log('\n===========================================');
    console.log('All migrations executed successfully!');
    console.log('===========================================');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
