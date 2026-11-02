import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

async function seed() {
  const hAdmin = await bcrypt.hash('Admin@123', 10);
  const hLeader = await bcrypt.hash('Leader@123', 10);
  const hCommoner = await bcrypt.hash('Citizen@123', 10);

  await pool.query('UPDATE profiles SET password_hash = $1 WHERE role = $2 OR email = $3', [hAdmin, 'super_admin', 'admin@apvoters.gov.in']);
  await pool.query('UPDATE profiles SET password_hash = $1 WHERE email = $2', [hLeader, 'leader.atmakuru@apvoters.gov.in']);
  await pool.query('UPDATE profiles SET password_hash = $1 WHERE email = $2', [hCommoner, 'citizen.guntur@apvoters.gov.in']);

  console.log('✔ Passwords verified and updated for admin@apvoters.gov.in, leader.atmakuru@apvoters.gov.in, citizen.guntur@apvoters.gov.in');
  await pool.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
