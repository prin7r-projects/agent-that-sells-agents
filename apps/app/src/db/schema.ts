// apps/app/src/db/schema.ts — Drizzle ORM schema for StampedAgents
// Per docs/12 §2.2. PostgreSQL 16 via docker-compose.

import { pgTable, text, integer, real, uniqueIndex, index, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Customers ──────────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id: text("id").primaryKey().$defaultFn(() => `cus_${crypto.randomUUID()}`),
  email: text("email").notNull().unique(),
  name: text("name"),
  agencyPartnerCode: text("agency_partner_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Agents ─────────────────────────────────────────────────────────────────
export const agents = pgTable("agents", {
  id: text("id").primaryKey(), // 'lot-042'
  lotNumber: integer("lot_number").notNull().unique(),
  displayName: text("display_name").notNull(),
  category: text("category").notNull(), // 'sdr' | 'support' | 'research' | 'ops'
  blurb: text("blurb").notNull().default(""),
  provenanceTrainedBy: text("provenance_trained_by").notNull(),
  provenanceShipCount: integer("provenance_ship_count").notNull(),
  provenanceCostPerAction: real("cost_per_action"),
  driftStatus: text("drift_status").default("green"),
  publicEvalLogJson: text("public_eval_log").default("[]"),
});

// ── Orders ─────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: text("id").primaryKey(), // 'trial-{uuid}-lot-042'
  customerId: text("customer_id").references(() => customers.id),
  agentId: text("agent_id").references(() => agents.id),
  tier: text("tier").notNull(), // 'trial' | 'pro' | 'enterprise'
  status: text("status").default("pending"), // 'pending' | 'paid' | 'refunded' | 'expired'
  priceAmountUsd: real("price_amount_usd"),
  paymentProvider: text("payment_provider").default("nowpayments"),
  invoiceId: text("invoice_id"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  referralCode: text("referral_code"),
  billingMode: text("billing_mode").default("flat"), // 'flat' | 'outcome'
  billingCap: real("billing_cap"), // 1.5x cap for outcome mode
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("orders_customer_status_idx").on(table.customerId, table.status),
  uniqueIndex("orders_invoice_id_unique").on(table.invoiceId).where(sql`${table.invoiceId} IS NOT NULL`),
]);

// ── Licenses ───────────────────────────────────────────────────────────────
export const licenses = pgTable("licenses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").references(() => orders.id),
  customerId: text("customer_id").references(() => customers.id),
  agentId: text("agent_id").references(() => agents.id),
  tier: text("tier").notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("licenses_customer_agent_valid_idx").on(table.customerId, table.agentId, table.validUntil),
]);

// ── API Keys ───────────────────────────────────────────────────────────────
export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey().$defaultFn(() => `key_${crypto.randomUUID().slice(0, 8)}`),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  keyHash: text("key_hash").notNull().unique(), // sha256(raw_key)
  keyPrefix: text("key_prefix").notNull(), // first 20 chars for display
  label: text("label").default("default"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, (table) => [
  index("api_keys_customer_idx").on(table.customerId),
]);

// ── Referrals ──────────────────────────────────────────────────────────────
export const referrals = pgTable("referrals", {
  code: text("code").primaryKey(), // 'AGENCY-NYC-014'
  agencyName: text("agency_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  revShareBps: integer("rev_share_bps").default(3000), // 30% = 3000 bps
  active: boolean("active").default(true),
});

// ── Eval Runs ──────────────────────────────────────────────────────────────
export const evalRuns = pgTable("eval_runs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agentId: text("agent_id").notNull().references(() => agents.id),
  corpus: text("corpus").notNull(),
  scoreBps: integer("score_bps").notNull(),
  evaluator: text("evaluator").notNull(),
  runDate: timestamp("run_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Credit Transactions (rev-share ledger) ─────────────────────────────────
export const creditTransactions = pgTable("credit_transactions", {
  id: text("id").primaryKey().$defaultFn(() => `txn_${crypto.randomUUID()}`),
  orderId: text("order_id").references(() => orders.id),
  type: text("type").notNull(), // 'rev_share_accrual' | 'rev_share_reversal' | 'credit_grant' | 'credit_consume'
  amountUsd: real("amount_usd").notNull(),
  referralCode: text("referral_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Magic Links ────────────────────────────────────────────────────────────
export const magicLinks = pgTable("magic_links", {
  id: text("id").primaryKey().$defaultFn(() => `ml_${crypto.randomUUID()}`),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  orderId: text("order_id").references(() => orders.id),
  usedAt: timestamp("used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("magic_links_email_idx").on(table.email),
  index("magic_links_token_idx").on(table.token),
]);

// ── Feature Flags ──────────────────────────────────────────────────────────
export const featureFlags = pgTable("feature_flags", {
  id: text("id").primaryKey(),
  enabled: boolean("enabled").default(false),
  rolloutPct: integer("rollout_pct").default(0),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
