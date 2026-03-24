import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// When running against Neon Local (dev), route HTTP queries through the local proxy.
// In production NEON_LOCAL_HOST is unset, so the driver connects to Neon Cloud directly.
if (process.env.NEON_LOCAL_HOST) {
  neonConfig.fetchEndpoint = `http://${process.env.NEON_LOCAL_HOST}:5432/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

const sql = neon(process.env.DATABASE_URL!);

const db = drizzle(sql);

export { db, sql };
