// Order persistence service — Phase 3 (docs/13 Phase 3 Task 1)
// DB-backed via Drizzle ORM + PostgreSQL.

import { eq, and, desc } from "drizzle-orm";

// Static import — all consumers use runtime: "nodejs"
import { db, schema } from "../../src/db/index";

interface PersistedOrder {
  orderId: string;
  tier: string;
  agentId?: string;
  agentLot?: string;
  status: "pending" | "paid" | "refunded" | "expired";
  priceAmountUsd: number;
  referralCode?: string;
  upgradeFrom?: string;
  customerEmail?: string;
  invoiceId?: string;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
  billingMode?: string;
  billingCap?: number;
}

interface License {
  orderId: string;
  customerEmail: string;
  agentId: string;
  tier: string;
  validUntil: string;
  revokedAt?: string;
  issuedAt: string;
}

interface RevShareEntry {
  orderId: string;
  referralCode: string;
  amountUsd: number;
  bps: number;
  createdAt: string;
}

export const OrderService = {
  /** Persist a pending order after checkout creation */
  async create(params: {
    orderId: string;
    tier: string;
    agentLot?: string;
    priceAmountUsd: number;
    referralCode?: string;
    upgradeFrom?: string;
    customerEmail?: string;
    invoiceId?: string;
  }): Promise<PersistedOrder> {

    // Upsert customer if email provided
    let customerId: string | null = null;
    if (params.customerEmail) {
      const existing = await db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.email, params.customerEmail.toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        customerId = existing[0].id;
      } else {
        const [newCustomer] = await db
          .insert(schema.customers)
          .values({ email: params.customerEmail.toLowerCase() })
          .returning();
        customerId = newCustomer.id;
      }
    }

    const [order] = await db
      .insert(schema.orders)
      .values({
        id: params.orderId,
        customerId,
        agentId: params.agentLot ? `lot-${params.agentLot}` : null,
        tier: params.tier,
        status: "pending",
        priceAmountUsd: params.priceAmountUsd,
        invoiceId: params.invoiceId,
        referralCode: params.referralCode,
      })
      .returning();

    const full = await this.get(order.id);
    if (!full) throw new Error("Order created but could not be retrieved");
    return full;
  },

  /** Mark an order as paid (idempotent on orderId+status) */
  async markPaid(orderId: string): Promise<PersistedOrder | null> {

    const existing = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId))
      .limit(1);

    if (existing.length === 0) return null;

    const order = existing[0];
    if (order.status === "paid") {
      return {
        orderId: order.id,
        tier: order.tier,
        agentId: order.agentId ?? undefined,
        agentLot: order.agentId ? order.agentId.replace(/^lot-/, "") : undefined,
        status: "paid",
        priceAmountUsd: order.priceAmountUsd ?? 0,
        referralCode: order.referralCode ?? undefined,
        invoiceId: order.invoiceId ?? undefined,
        paidAt: order.paidAt?.toISOString(),
        createdAt: order.createdAt.toISOString(),
        billingMode: order.billingMode ?? undefined,
        billingCap: order.billingCap ?? undefined,
      };
    }

    const [updated] = await db
      .update(schema.orders)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(schema.orders.id, orderId))
      .returning();

    return {
      orderId: updated.id,
      tier: updated.tier,
      agentId: updated.agentId ?? undefined,
      agentLot: updated.agentId ? updated.agentId.replace(/^lot-/, "") : undefined,
      status: "paid",
      priceAmountUsd: updated.priceAmountUsd ?? 0,
      referralCode: updated.referralCode ?? undefined,
      invoiceId: updated.invoiceId ?? undefined,
      paidAt: updated.paidAt?.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      billingMode: updated.billingMode ?? undefined,
      billingCap: updated.billingCap ?? undefined,
    };
  },

  /** Get an order by ID */
  async get(orderId: string): Promise<PersistedOrder | null> {

    const existing = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId))
      .limit(1);

    if (existing.length === 0) return null;

    const order = existing[0];
    return {
      orderId: order.id,
      tier: order.tier,
      agentId: order.agentId ?? undefined,
      agentLot: order.agentId ? order.agentId.replace(/^lot-/, "") : undefined,
      status: order.status as PersistedOrder["status"],
      priceAmountUsd: order.priceAmountUsd ?? 0,
      referralCode: order.referralCode ?? undefined,
      invoiceId: order.invoiceId ?? undefined,
      paidAt: order.paidAt?.toISOString(),
      refundedAt: order.refundedAt?.toISOString(),
      createdAt: order.createdAt.toISOString(),
      billingMode: order.billingMode ?? undefined,
      billingCap: order.billingCap ?? undefined,
    };
  },

  /** List orders by customer email */
  async listByCustomer(email: string): Promise<PersistedOrder[]> {

    const results = await db
      .select()
      .from(schema.orders)
      .innerJoin(schema.customers, eq(schema.orders.customerId, schema.customers.id))
      .where(eq(schema.customers.email, email.toLowerCase()))
      .orderBy(desc(schema.orders.createdAt));

    return results.map((r: any) => ({
      orderId: r.orders.id,
      tier: r.orders.tier,
      agentId: r.orders.agentId ?? undefined,
      agentLot: r.orders.agentId ? r.orders.agentId.replace(/^lot-/, "") : undefined,
      status: r.orders.status as PersistedOrder["status"],
      priceAmountUsd: r.orders.priceAmountUsd ?? 0,
      referralCode: r.orders.referralCode ?? undefined,
      invoiceId: r.orders.invoiceId ?? undefined,
      customerEmail: r.customers?.email ?? undefined,
      paidAt: r.orders.paidAt?.toISOString(),
      createdAt: r.orders.createdAt.toISOString(),
      billingMode: r.orders.billingMode ?? undefined,
      billingCap: r.orders.billingCap ?? undefined,
    }));
  },

  /** Mark order as refunded */
  async refund(orderId: string, reason?: string): Promise<PersistedOrder | null> {

    const existing = await this.get(orderId);
    if (!existing) return null;

    await db
      .update(schema.orders)
      .set({ status: "refunded", refundedAt: new Date() })
      .where(eq(schema.orders.id, orderId));

    return this.get(orderId);
  },

  /** Update billing mode for an order */
  async updateBillingMode(orderId: string, mode: "flat" | "outcome", cap?: number): Promise<PersistedOrder | null> {

    const existing = await this.get(orderId);
    if (!existing) return null;

    await db
      .update(schema.orders)
      .set({
        billingMode: mode,
        billingCap: mode === "outcome" ? (cap ?? 1.5) : null,
      })
      .where(eq(schema.orders.id, orderId));

    return this.get(orderId);
  },

  /** List all orders (admin) */
  async listAll(): Promise<PersistedOrder[]> {

    const results = await db
      .select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt));

    return results.map((r: any) => ({
      orderId: r.id,
      tier: r.tier,
      agentId: r.agentId ?? undefined,
      agentLot: r.agentId ? r.agentId.replace(/^lot-/, "") : undefined,
      status: r.status as PersistedOrder["status"],
      priceAmountUsd: r.priceAmountUsd ?? 0,
      referralCode: r.referralCode ?? undefined,
      invoiceId: r.invoiceId ?? undefined,
      paidAt: r.paidAt?.toISOString(),
      refundedAt: r.refundedAt?.toISOString(),
      createdAt: r.createdAt.toISOString(),
      billingMode: r.billingMode ?? undefined,
      billingCap: r.billingCap ?? undefined,
    }));
  },

  /** Aggregate order stats (admin) */
  async stats(): Promise<{ total: number; paid: number; pending: number; refunded: number }> {

    const results = await db.select().from(schema.orders);
    const total = results.length;
    const paid = results.filter((r: any) => r.status === "paid").length;
    const pending = results.filter((r: any) => r.status === "pending").length;
    const refunded = results.filter((r: any) => r.status === "refunded").length;

    return { total, paid, pending, refunded };
  },
};

export const LicenseService = {
  /** Issue a license after payment */
  async issue(params: {
    orderId: string;
    customerEmail: string;
    agentId: string;
    tier: string;
    validMonths?: number;
  }): Promise<License> {

    // Get or create customer
    let customerId: string;
    const existing = await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.email, params.customerEmail.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      customerId = existing[0].id;
    } else {
      const [newCustomer] = await db
        .insert(schema.customers)
        .values({ email: params.customerEmail.toLowerCase() })
        .returning();
      customerId = newCustomer.id;
    }

    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + (params.validMonths ?? 1));

    const [license] = await db
      .insert(schema.licenses)
      .values({
        orderId: params.orderId,
        customerId,
        agentId: params.agentId,
        tier: params.tier,
        validUntil,
      })
      .returning();

    return {
      orderId: license.orderId!,
      customerEmail: params.customerEmail,
      agentId: license.agentId!,
      tier: license.tier,
      validUntil: license.validUntil.toISOString(),
      issuedAt: license.createdAt.toISOString(),
    };
  },

  /** Get licenses for a customer */
  async listByCustomer(email: string): Promise<License[]> {

    const results = await db
      .select()
      .from(schema.licenses)
      .innerJoin(schema.customers, eq(schema.licenses.customerId, schema.customers.id))
      .where(eq(schema.customers.email, email.toLowerCase()));

    return results.map((r: any) => ({
      orderId: r.licenses.orderId,
      customerEmail: email,
      agentId: r.licenses.agentId,
      tier: r.licenses.tier,
      validUntil: r.licenses.validUntil.toISOString(),
      revokedAt: r.licenses.revokedAt?.toISOString(),
      issuedAt: r.licenses.createdAt.toISOString(),
    }));
  },

  /** List all licenses */
  async listAll(): Promise<License[]> {

    const results = await db
      .select()
      .from(schema.licenses)
      .leftJoin(schema.customers, eq(schema.licenses.customerId, schema.customers.id))
      .orderBy(desc(schema.licenses.createdAt));

    return results.map((r: any) => ({
      orderId: r.licenses.orderId,
      customerEmail: r.customers?.email ?? "unknown",
      agentId: r.licenses.agentId,
      tier: r.licenses.tier,
      validUntil: r.licenses.validUntil.toISOString(),
      revokedAt: r.licenses.revokedAt?.toISOString(),
      issuedAt: r.licenses.createdAt.toISOString(),
    }));
  },

  /** Revoke a license */
  async revoke(orderId: string): Promise<License | null> {

    const [updated] = await db
      .update(schema.licenses)
      .set({ revokedAt: new Date() })
      .where(eq(schema.licenses.orderId, orderId))
      .returning();

    if (!updated) return null;

    // Get customer email
    const customer = await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, updated.customerId!))
      .limit(1);

    return {
      orderId: updated.orderId!,
      customerEmail: customer[0]?.email ?? "unknown",
      agentId: updated.agentId!,
      tier: updated.tier,
      validUntil: updated.validUntil.toISOString(),
      revokedAt: updated.revokedAt?.toISOString(),
      issuedAt: updated.createdAt.toISOString(),
    };
  },
};

export const RevShareService = {
  /** Accrue rev-share for a partner referral */
  async accrue(params: {
    orderId: string;
    referralCode: string;
    amountUsd: number;
    bps?: number;
  }): Promise<RevShareEntry> {

    const [entry] = await db
      .insert(schema.creditTransactions)
      .values({
        orderId: params.orderId,
        type: "rev_share_accrual",
        amountUsd: params.amountUsd,
        referralCode: params.referralCode,
      })
      .returning();

    return {
      orderId: entry.orderId!,
      referralCode: entry.referralCode!,
      amountUsd: entry.amountUsd,
      bps: params.bps ?? 3000,
      createdAt: entry.createdAt.toISOString(),
    };
  },

  /** Get rev-share for a partner code */
  async getByCode(code: string): Promise<RevShareEntry[]> {

    const results = await db
      .select()
      .from(schema.creditTransactions)
      .where(
        and(
          eq(schema.creditTransactions.referralCode, code),
          eq(schema.creditTransactions.type, "rev_share_accrual")
        )
      )
      .orderBy(desc(schema.creditTransactions.createdAt));

    return results.map((r: any) => ({
      orderId: r.orderId,
      referralCode: r.referralCode!,
      amountUsd: r.amountUsd,
      bps: 3000,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  /** Reverse rev-share entries for an order (used during refund) */
  async reverseForOrder(orderId: string): Promise<RevShareEntry | null> {

    const existing = await db
      .select()
      .from(schema.creditTransactions)
      .where(
        and(
          eq(schema.creditTransactions.orderId, orderId),
          eq(schema.creditTransactions.type, "rev_share_accrual"),
        ),
      )
      .limit(1);

    if (existing.length === 0) return null;

    const [reversal] = await db
      .insert(schema.creditTransactions)
      .values({
        orderId,
        type: "rev_share_reversal",
        amountUsd: -existing[0].amountUsd,
        referralCode: existing[0].referralCode,
      })
      .returning();

    return {
      orderId: reversal.orderId!,
      referralCode: reversal.referralCode!,
      amountUsd: reversal.amountUsd,
      bps: 3000,
      createdAt: reversal.createdAt.toISOString(),
    };
  },

  /** Sum total rev-share accrued for a partner code */
  async totalByCode(code: string): Promise<number> {
    const entries = await this.getByCode(code);
    return entries.reduce((sum, e) => sum + e.amountUsd, 0);
  },

  /** List all rev-share entries (admin) */
  async listAll(): Promise<RevShareEntry[]> {

    const results = await db
      .select()
      .from(schema.creditTransactions)
      .where(eq(schema.creditTransactions.type, "rev_share_accrual"))
      .orderBy(desc(schema.creditTransactions.createdAt));

    return results.map((r: any) => ({
      orderId: r.orderId,
      referralCode: r.referralCode!,
      amountUsd: r.amountUsd,
      bps: 3000,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  /** Aggregate rev-share stats (admin) */
  async stats(): Promise<{ totalEntries: number; totalUsd: number; uniqueCodes: number }> {

    const results = await db
      .select()
      .from(schema.creditTransactions)
      .where(eq(schema.creditTransactions.type, "rev_share_accrual"));

    const totalEntries = results.length;
    const totalUsd = results.reduce((sum: number, r: any) => sum + r.amountUsd, 0);
    const uniqueCodes = new Set(results.map((r: any) => r.referralCode)).size;

    return { totalEntries, totalUsd, uniqueCodes };
  },
};
