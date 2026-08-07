import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';

const pool = new Pool({
  connectionString: process.env.NOTIFICATIONS_SERVICE_DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  // `pg` defaults connectionTimeoutMillis to 0 (wait forever). Since a
  // Prisma query runs inside consumer.run()'s eachMessage, an unbounded
  // wait for a pool connection would block the Kafka heartbeat and get the
  // consumer kicked from the group, triggering a rebalance.
  connectionTimeoutMillis: 10_000,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export async function closeDatabaseConnections() {
  await prisma.$disconnect();
  await pool.end();
}
