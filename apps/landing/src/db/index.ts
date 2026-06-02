// apps/landing/src/db/index.ts — PostgreSQL connection via Drizzle ORM
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is required (no dev default; set it in .env or docker-compose)",
  );
}

// Isolate this app's tables from any other tables that share the same DB.
const SCHEMA = process.env.STAMPED_AGENTS_DB_SCHEMA ?? "stampedagents";

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  // Set the search_path for every connection so unqualified table
  // references resolve into the project-specific schema.
  connection: {
    search_path: SCHEMA,
  },
});

export const db = drizzle(client, { schema });
export { schema };
export const DB_SCHEMA = SCHEMA;
