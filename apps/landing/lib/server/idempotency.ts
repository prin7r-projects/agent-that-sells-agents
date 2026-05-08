// Idempotency middleware for checkout — Phase 4 (docs/13 Phase 4 Task 1)
// Keyed by (customerEmail, agentId, tier, hourWindow).

interface IdempotencyEntry {
  orderId: string;
  invoiceUrl: string;
  invoiceId: string;
  createdAt: number;
}

// In-memory store; migrate to DB/Redis in Phase 4
const idempotencyStore = new Map<string, IdempotencyEntry>();

// Auto-clean entries older than 24h every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of idempotencyStore) {
    if (now - entry.createdAt > 24 * 60 * 60 * 1000) {
      idempotencyStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Build an idempotency key from checkout parameters.
 * Same buyer + same agent + same tier within the same hour → same invoice.
 */
export function buildIdempotencyKey(params: {
  email?: string;
  agentId?: string;
  tierId: string;
}): string {
  const hourWindow = Math.floor(Date.now() / (60 * 60 * 1000));
  const email = (params.email ?? "anon").toLowerCase().trim();
  const agent = (params.agentId ?? "none").toLowerCase().trim();
  return `chk:${email}:${agent}:${params.tierId}:${hourWindow}`;
}

/**
 * Check if an order was already created for this idempotency key.
 * Returns the cached response if found, null otherwise.
 */
export function checkIdempotency(
  key: string,
): IdempotencyEntry | null {
  const entry = idempotencyStore.get(key);
  if (!entry) return null;
  // Expire after 1 hour
  if (Date.now() - entry.createdAt > 60 * 60 * 1000) {
    idempotencyStore.delete(key);
    return null;
  }
  return entry;
}

/**
 * Store an idempotency entry after successful checkout creation.
 */
export function storeIdempotency(
  key: string,
  entry: Omit<IdempotencyEntry, "createdAt">,
): void {
  idempotencyStore.set(key, { ...entry, createdAt: Date.now() });
}

/**
 * IPN idempotency — keyed by (orderId, paymentStatus).
 * Returns true if this exact (orderId, status) combination was already processed.
 */
const processedIpns = new Set<string>();

export function isIpnProcessed(orderId: string, paymentStatus: string): boolean {
  const key = `${orderId}:${paymentStatus}`;
  if (processedIpns.has(key)) return true;
  processedIpns.add(key);
  return false;
}
