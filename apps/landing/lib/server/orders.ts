// Order persistence service — Phase 3 (docs/13 Phase 3 Task 1)
// In-memory store for MVP; migrates to DB in Phase 3 full.

interface PersistedOrder {
  orderId: string;
  tier: string;
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

// In-memory stores (migrate to DB in Phase 3 full)
const orders = new Map<string, PersistedOrder>();
const licenses = new Map<string, License[]>();
const revShareLedger: RevShareEntry[] = [];

export const OrderService = {
  /** Persist a pending order after checkout creation */
  create(params: {
    orderId: string;
    tier: string;
    agentLot?: string;
    priceAmountUsd: number;
    referralCode?: string;
    upgradeFrom?: string;
    customerEmail?: string;
    invoiceId?: string;
  }): PersistedOrder {
    const order: PersistedOrder = {
      orderId: params.orderId,
      tier: params.tier,
      agentLot: params.agentLot,
      status: "pending",
      priceAmountUsd: params.priceAmountUsd,
      referralCode: params.referralCode,
      upgradeFrom: params.upgradeFrom,
      customerEmail: params.customerEmail,
      invoiceId: params.invoiceId,
      createdAt: new Date().toISOString(),
    };
    orders.set(params.orderId, order);
    return order;
  },

  /** Mark an order as paid (idempotent on orderId+status) */
  markPaid(orderId: string): PersistedOrder | null {
    const order = orders.get(orderId);
    if (!order) return null;
    if (order.status === "paid") return order; // idempotent
    order.status = "paid";
    order.paidAt = new Date().toISOString();
    orders.set(orderId, order);
    return order;
  },

  /** Get an order by ID */
  get(orderId: string): PersistedOrder | null {
    return orders.get(orderId) ?? null;
  },

  /** List orders by customer email */
  listByCustomer(email: string): PersistedOrder[] {
    return Array.from(orders.values()).filter(
      (o) => o.customerEmail?.toLowerCase() === email.toLowerCase(),
    );
  },

  /** Mark order as refunded */
  refund(orderId: string, reason?: string): PersistedOrder | null {
    const order = orders.get(orderId);
    if (!order) return null;
    order.status = "refunded";
    order.refundedAt = new Date().toISOString();
    orders.set(orderId, order);
    return order;
  },
};

export const LicenseService = {
  /** Issue a license after payment */
  issue(params: {
    orderId: string;
    customerEmail: string;
    agentId: string;
    tier: string;
    validMonths?: number;
  }): License {
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + (params.validMonths ?? 1));
    const license: License = {
      orderId: params.orderId,
      customerEmail: params.customerEmail,
      agentId: params.agentId,
      tier: params.tier,
      validUntil: validUntil.toISOString(),
      issuedAt: new Date().toISOString(),
    };
    const existing = licenses.get(params.customerEmail) ?? [];
    existing.push(license);
    licenses.set(params.customerEmail, existing);
    return license;
  },

  /** Get licenses for a customer */
  listByCustomer(email: string): License[] {
    return licenses.get(email.toLowerCase()) ?? [];
  },

  /** Revoke a license */
  revoke(orderId: string): License | null {
    for (const [email, customerLicenses] of licenses) {
      const idx = customerLicenses.findIndex((l) => l.orderId === orderId);
      if (idx >= 0) {
        customerLicenses[idx].revokedAt = new Date().toISOString();
        return customerLicenses[idx];
      }
    }
    return null;
  },
};

export const RevShareService = {
  /** Accrue rev-share for a partner referral */
  accrue(params: {
    orderId: string;
    referralCode: string;
    amountUsd: number;
    bps?: number;
  }): RevShareEntry {
    const entry: RevShareEntry = {
      orderId: params.orderId,
      referralCode: params.referralCode,
      amountUsd: params.amountUsd,
      bps: params.bps ?? 3000,
      createdAt: new Date().toISOString(),
    };
    revShareLedger.push(entry);
    return entry;
  },

  /** Get rev-share for a partner code */
  getByCode(code: string): RevShareEntry[] {
    return revShareLedger.filter((e) => e.referralCode === code);
  },
};
