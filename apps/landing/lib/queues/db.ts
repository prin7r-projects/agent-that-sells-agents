// apps/landing/lib/queues/db.ts — Database connection for BullMQ workers
// Shared by eval-runner and digest-runner. Uses drizzle-orm + postgres-js.
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../../app/src/db/schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://stampedagents:stampedagents_dev@localhost:5432/stampedagents";

const client = postgres(connectionString, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export { schema };
