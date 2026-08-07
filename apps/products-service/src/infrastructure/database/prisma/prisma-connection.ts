import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';

const pool = new Pool({
  connectionString: process.env.PRODUCTS_SERVICE_DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  // `pg` defaults connectionTimeoutMillis to 0 (wait forever). Bound it so a
  // stalled Postgres connection fails fast and loudly instead of hanging a
  // request/handler indefinitely.
  connectionTimeoutMillis: 10_000,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export async function closeDatabaseConnections() {
  await prisma.$disconnect();
  await pool.end();
}
