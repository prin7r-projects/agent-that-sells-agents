// apps/app/src/db/schema.ts — Drizzle ORM schema for StampedAgents
// Per docs/12 §2.2. SQLite for MVP; migrate to Postgres per docs/13 Phase 1 notes.
//
// This file is the canonical entity source. It is currently a reference
// schema file; the actual DB wiring happens when docker-compose adds
// the postgres service and apps/app gets its full scaffold.

import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";

// ── Customers ──────────────────────────────────────────────────────────────
export const customers = sqliteTable("customers", {
  id: text("id").primaryKey().$defaultFn(() => `cus_${crypto.randomUUID()}`),
  email: text("email").notNull().unique(),
  name: text("name"),
  agencyPartnerCode: text("agency_partner_code"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// ── Agents ─────────────────────────────────────────────────────────────────
export const agents = sqliteTable("agents", {
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
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(), // 'trial-{uuid}-lot-042'
  customerId: text("customer_id").references(() => customers.id),
  agentId: text("agent_id").references(() => agents.id),
  tier: text("tier").notNull(), // 'trial' | 'pro' | 'enterprise'
  status: text("status").default("pending"),
  priceAmountUsd: real("price_amount_usd"),
  paymentProvider: text("payment_provider").default("nowpayments"),
  invoiceId: text("invoice_id"),
  paidAt: text("paid_at"),
  refundedAt: text("refunded_at"),
  referralCode: text("referral_code"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("orders_customer_status_idx").on(table.customerId, table.status),
  uniqueIndex("orders_invoice_id_unique").on(table.invoiceId).where(table.invoiceId.notNull()),
]);

// ── Licenses ───────────────────────────────────────────────────────────────
export const licenses = sqliteTable("licenses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").references(() => orders.id),
  customerId: text("customer_id").references(() => customers.id),
  agentId: text("agent_id").references(() => agents.id),
  tier: text("tier").notNull(),
  validUntil: text("valid_until").notNull(),
  revokedAt: text("revoked_at"),
}, (table) => [
  index("licenses_customer_agent_valid_idx").on(table.customerId, table.agentId, table.validUntil),
]);

// ── Referrals ──────────────────────────────────────────────────────────────
export const referrals = sqliteTable("referrals", {
  code: text("code").primaryKey(), // 'AGENCY-NYC-014'
  agencyName: text("agency_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  revShareBps: integer("rev_share_bps").default(3000), // 30% = 3000 bps
  active: integer("active", { mode: "boolean" }).default(true),
});

// ── Eval Runs ──────────────────────────────────────────────────────────────
export const evalRuns = sqliteTable("evalRuns", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agentId: text("agent_id").notNull().references(() => agents.id),
  corpus: text("corpus").notNull(),
  scoreBps: integer("score_bps").notNull(),
  evaluator: text("evaluator").notNull(),
  runDate: text("run_date").notNull(),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// ── Credit Transactions (rev-share ledger) ─────────────────────────────────
export const creditTransactions = sqliteTable("credit_transactions", {
  id: text("id").primaryKey().$defaultFn(() => `txn_${crypto.randomUUID()}`),
  orderId: text("order_id").references(() => orders.id),
  type: text("type").notNull(), // 'rev_share_accrual' | 'rev_share_reversal'
  amountUsd: real("amount_usd").notNull(),
  referralCode: text("referral_code"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// ── Feature Flags ──────────────────────────────────────────────────────────
export const featureFlags = sqliteTable("feature_flags", {
  id: text("id").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }).default(false),
  rolloutPct: integer("rollout_pct").default(0),
  description: text("description"),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});
