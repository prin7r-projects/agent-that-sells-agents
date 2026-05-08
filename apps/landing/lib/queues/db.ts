// apps/landing/lib/queues/db.ts — Database connection for BullMQ workers
// Shared by eval-runner and digest-runner. Uses postgres-js directly.
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://stampedagents:stampedagents_dev@localhost:5432/stampedagents";

export const sql = postgres(connectionString, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});
