import pg from 'pg';
import { ENV } from './env.js';

const { Pool } = pg;

let pool = null;

if (ENV.DATABASE_URL) {
  let connStr = ENV.DATABASE_URL;

  // Auto-encode '@' in password if present: postgresql://user:pass@word@host:port/db
  try {
    const lastAt = connStr.lastIndexOf('@');
    const firstColon = connStr.indexOf('://');
    if (lastAt > -1 && firstColon > -1) {
      const credsPart = connStr.substring(firstColon + 3, lastAt);
      const hostPart = connStr.substring(lastAt + 1);
      const prefix = connStr.substring(0, firstColon + 3);
      const colonIdx = credsPart.indexOf(':');
      if (colonIdx > -1) {
        const username = credsPart.substring(0, colonIdx);
        const rawPass = decodeURIComponent(credsPart.substring(colonIdx + 1));
        connStr = `${prefix}${username}:${encodeURIComponent(rawPass)}@${hostPart}`;
      }
    }
  } catch (err) {
    console.warn('URL parse warning:', err.message);
  }

  pool = new Pool({
    connectionString: connStr,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
  });
}

export { pool };
