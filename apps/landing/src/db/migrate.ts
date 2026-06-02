// apps/landing/src/db/migrate.ts
// Idempotent bootstrap script that creates the StampedAgents schema.
// Mirrors src/db/schema.ts so we don't need drizzle-kit in CI.
// Run: pnpm db:push

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is required (no dev default; set it in .env or docker-compose)",
  );
}

// Isolate this app's tables from the shared `public` schema.
const SCHEMA = process.env.STAMPED_AGENTS_DB_SCHEMA ?? "stampedagents";

const STATEMENTS: string[] = [
  `CREATE SCHEMA IF NOT EXISTS "${SCHEMA}"`,
  `SET search_path TO "${SCHEMA}"`,
  // customers
  `CREATE TABLE IF NOT EXISTS "${SCHEMA}".customers (
    id text PRIMARY KEY,
    email text NOT NULL UNIQUE,
    name text,
    agency_partner_code text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  // agents
  `CREATE TABLE IF NOT EXISTS "${SCHEMA}".agents (
    id text PRIMARY KEY,
    lot_number integer NOT NULL UNIQUE,
    display_name text NOT NULL,
    category text NOT NULL,
    blurb text NOT NULL DEFAULT '',
    provenance_trained_by text NOT NULL,
    provenance_ship_count integer NOT NULL,
    cost_per_action real,
    drift_status text DEFAULT 'green',
    public_eval_log text DEFAULT '[]'
  )`,
  // orders
  `CREATE TABLE IF NOT EXISTS "${SCHEMA}".orders (
    id text PRIMARY KEY,
    customer_id text REFERENCES "${SCHEMA}".customers(id),
    agent_id text REFERENCES "${SCHEMA}".agents(id),
    tier text NOT NULL,
    status text DEFAULT 'pending',
    price_amount_usd real,
    payment_provider text DEFAULT 'nowpayments',
    invoice_id text,
    paid_at timestamptz,
    refunded_at timestamptz,
    referral_code text,
    billing_mode text DEFAULT 'flat',
    billing_cap real,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS orders_customer_status_idx
    ON "${SCHEMA}".orders (customer_id, status)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS orders_invoice_id_unique
    ON "${SCHEMA}".orders (invoice_id) WHERE invoice_id IS NOT NULL`,
  // licenses
  `CREATE TABLE IF NOT EXISTS "${SCHEMA}".licenses (
    id text PRIMARY KEY,
    order_id text REFERENCES "${SCHEMA}".orders(id),
    customer_id text REFERENCES "${SCHEMA}".customers(id),
    agent_id text REFERENCES "${SCHEMA}".agents(id),
    tier text NOT NULL,
    valid_until timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS licenses_customer_agent_valid_idx
    ON "${SCHEMA}".licenses (customer_id, agent_id, valid_until)`,
  // api_keys
  `CREATE TABLE IF NOT EXISTS "${SCHEMA}".api_keys (
    id text PRIMARY KEY,
    customer_id text NOT NULL REFERENCES "${SCHEMA}".customers(id),
    key_hash text NOT NULL UNIQUE,
    key_prefix text NOT NULL,
    label text DEFAULT 'default',
    last_used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS api_keys_customer_idx
    ON "${SCHEMA}".api_keys (customer_id)`,
  // referrals
  `CREATE TABLE IF NOT EXISTS "${SCHEMA}".referrals (
    code text PRIMARY KEY,
    agency_name text NOT NULL,
    contact_email text NOT NULL,
    rev_share_bps integer DEFAULT 3000,
    active boolean DEFAULT true
  )`,
  // eval_runs
  `CREATE TABLE IF NOT EXISTS "${SCHEMA}".eval_runs (
    id text PRIMARY KEY,
    agent_id text NOT NULL REFERENCES "${SCHEMA}".agents(id),
    corpus text NOT NULL,
    score_bps integer NOT NULL,
    evaluator text NOT NULL,
    run_date timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  // credit_transactions
  `CREATE TABLE IF NOT EXISTS "${SCHEMA}".credit_transactions (
    id text PRIMARY KEY,
    order_id text REFERENCES "${SCHEMA}".orders(id),
    type text NOT NULL,
    amount_usd real NOT NULL,
    referral_code text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  // magic_links
  `CREATE TABLE IF NOT EXISTS "${SCHEMA}".magic_links (
    id text PRIMARY KEY,
    email text NOT NULL,
    token text NOT NULL UNIQUE,
    order_id text REFERENCES "${SCHEMA}".orders(id),
    used_at timestamptz,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS magic_links_email_idx
    ON "${SCHEMA}".magic_links (email)`,
  `CREATE INDEX IF NOT EXISTS magic_links_token_idx
    ON "${SCHEMA}".magic_links (token)`,
  // feature_flags
  `CREATE TABLE IF NOT EXISTS "${SCHEMA}".feature_flags (
    id text PRIMARY KEY,
    enabled boolean DEFAULT false,
    rollout_pct integer DEFAULT 0,
    description text,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
];

export async function runMigrations(): Promise<void> {
  const sql = postgres(connectionString, { connect_timeout: 10, max: 1 });
  try {
    for (const stmt of STATEMENTS) {
      await sql.unsafe(stmt);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

// Allow direct execution: `pnpm tsx src/db/migrate.ts`
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log(`[db:migrate] schema "${SCHEMA}" applied`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[db:migrate] failed:", err);
      process.exit(1);
    });
}
