/**
 * Forged-IPN simulation test suite — Phase 4 Task 3 (docs/13 §Phase 4)
 *
 * Covers:
 *   - Forged signature rejection (verifyNowpaymentsIpn)
 *   - IPN replay / idempotency (isIpnProcessed)
 *   - Checkout idempotency (buildIdempotencyKey, checkIdempotency, storeIdempotency)
 *   - Webhook handler 401 on bad sig
 *   - Happy-path HMAC verification with known secret + computed sig
 *
 * No live NOWPayments API calls — all HMAC is computed locally.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import {
  verifyNowpaymentsIpn,
  sortObject,
  timingSafeEqualHex,
} from "@/lib/signatures";
import {
  buildIdempotencyKey,
  checkIdempotency,
  storeIdempotency,
  isIpnProcessed,
} from "@/lib/server/idempotency";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build an HMAC-SHA512 hex digest the same way NOWPayments does. */
function signPayload(payload: unknown, secret: string): string {
  const sorted = JSON.stringify(sortObject(payload));
  return crypto.createHmac("sha512", secret.trim()).update(sorted).digest("hex");
}

// ---------------------------------------------------------------------------
// verifyNowpaymentsIpn
// ---------------------------------------------------------------------------

describe("verifyNowpaymentsIpn", () => {
  const secret = "ipn-secret-abc123";
  const payload = {
    order_id: "stmp_pro_ref_FOO_ltest",
    payment_status: "finished",
    price_amount: 99,
    price_currency: "usd",
  };

  it("returns true for a correctly computed signature", () => {
    const sig = signPayload(payload, secret);
    expect(verifyNowpaymentsIpn(payload, sig, secret)).toBe(true);
  });

  it("returns false for a forged (random) signature", () => {
    const badSig =
      "aa" + "00".repeat(63); // 128-char hex for SHA-512
    expect(verifyNowpaymentsIpn(payload, badSig, secret)).toBe(false);
  });

  it("returns false for a null signature", () => {
    expect(verifyNowpaymentsIpn(payload, null, secret)).toBe(false);
  });

  it("returns false when the secret differs", () => {
    const sig = signPayload(payload, secret);
    expect(verifyNowpaymentsIpn(payload, sig, "different-secret")).toBe(false);
  });

  it("returns false when payload is tampered (different order_id)", () => {
    const sig = signPayload(payload, secret);
    const tampered = { ...payload, order_id: "stmp_hacked" };
    expect(verifyNowpaymentsIpn(tampered, sig, secret)).toBe(false);
  });

  it("handles deep-sorted nested objects (signature invariant)", () => {
    const nested = {
      z: 1,
      a: { b: 2, a: 1 },
    };
    const sig = signPayload(nested, secret);
    // Reshuffled keys should still verify
    const reshuffled = {
      a: { a: 1, b: 2 },
      z: 1,
    };
    expect(verifyNowpaymentsIpn(reshuffled, sig, secret)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isIpnProcessed (IPN idempotency)
// ---------------------------------------------------------------------------

describe("isIpnProcessed", () => {
  it("returns false on first call for a given (orderId, status) pair", () => {
    expect(isIpnProcessed("ord-1", "finished")).toBe(false);
  });

  it("returns true on second call for the same (orderId, status) pair", () => {
    // First call already happened above — verifies Set-based memory
    expect(isIpnProcessed("ord-1", "finished")).toBe(true);
  });

  it("returns false for a different status on the same orderId", () => {
    expect(isIpnProcessed("ord-1", "confirmed")).toBe(false);
  });

  it("returns false for a different orderId with the same status", () => {
    expect(isIpnProcessed("ord-2", "finished")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Checkout idempotency (buildIdempotencyKey, checkIdempotency, storeIdempotency)
// ---------------------------------------------------------------------------

describe("checkout idempotency module", () => {
  it("buildIdempotencyKey: same inputs in same hour produce identical keys", () => {
    const params = {
      email: "test@example.com",
      agentId: "lot-042",
      tierId: "pro",
    };
    const keys = Array.from({ length: 5 }, () =>
      buildIdempotencyKey(params),
    );
    const unique = new Set(keys);
    expect(unique.size).toBe(1);
  });

  it("buildIdempotencyKey: different emails produce different keys", () => {
    const k1 = buildIdempotencyKey({
      email: "a@b.com",
      tierId: "pro",
    });
    const k2 = buildIdempotencyKey({
      email: "c@d.com",
      tierId: "pro",
    });
    expect(k1).not.toBe(k2);
  });

  it("buildIdempotencyKey: missing email and agent default to 'anon'/'none'", () => {
    const k = buildIdempotencyKey({ tierId: "trial" });
    expect(k).toContain("anon");
    expect(k).toContain("none");
    expect(k).toContain("trial");
  });

  it("checkIdempotency returns null for an unknown key", () => {
    expect(checkIdempotency("nonexistent-key")).toBeNull();
  });

  it("storeIdempotency + checkIdempotency round-trip", () => {
    const key = `test-roundtrip-${Date.now()}`;
    const entry = {
      orderId: "stmp_pro_test123",
      invoiceUrl: "https://nowpayments.io/invoice/abc",
      invoiceId: "inv-456",
    };
    storeIdempotency(key, entry);
    const cached = checkIdempotency(key);
    expect(cached).not.toBeNull();
    expect(cached!.orderId).toBe(entry.orderId);
    expect(cached!.invoiceUrl).toBe(entry.invoiceUrl);
    expect(cached!.invoiceId).toBe(entry.invoiceId);
  });

  it("checkIdempotency returns the same entry on repeated calls", () => {
    const key = `test-repeat-${Date.now()}`;
    const entry = {
      orderId: "stmp_pro_repeat",
      invoiceUrl: "https://nowpayments.io/invoice/repeat",
      invoiceId: "inv-repeat",
    };
    storeIdempotency(key, entry);
    const first = checkIdempotency(key);
    const second = checkIdempotency(key);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first!.orderId).toBe(second!.orderId);
  });
});

// ---------------------------------------------------------------------------
// timingSafeEqualHex
// ---------------------------------------------------------------------------

describe("timingSafeEqualHex", () => {
  it("returns true for identical hex strings", () => {
    const hex = crypto.randomBytes(32).toString("hex");
    expect(timingSafeEqualHex(hex, hex)).toBe(true);
  });

  it("returns false for different-length hex strings", () => {
    expect(timingSafeEqualHex("ab", "abc")).toBe(false);
  });

  it("returns false for different same-length hex strings", () => {
    const a = "a".repeat(64);
    const b = "b".repeat(64);
    expect(timingSafeEqualHex(a, b)).toBe(false);
  });

  it("is case-insensitive", () => {
    const hex = crypto.randomBytes(32).toString("hex");
    expect(timingSafeEqualHex(hex, hex.toUpperCase())).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Webhook handler: 401 on forged signature
// ---------------------------------------------------------------------------

describe("webhook handler (POST /api/webhooks/nowpayments)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NOWPAYMENTS_IPN_SECRET", "webhook-secret-x");
  });

  it("returns 401 when signature is forged", async () => {
    // Dynamic import to avoid Next.js module resolution issues in test env
    const { POST } = await import(
      "@/app/api/webhooks/nowpayments/route"
    );

    const payload = {
      order_id: "stmp_trial_ltest",
      payment_status: "finished",
      price_amount: 99,
    };

    const badSig = "ff".repeat(64); // 128-char hex

    const req = new Request("http://localhost/api/webhooks/nowpayments", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nowpayments-sig": badSig,
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("invalid_signature");
  });

  it("returns 200 when signature is valid (happy path)", async () => {
    const { POST } = await import(
      "@/app/api/webhooks/nowpayments/route"
    );

    const payload = {
      order_id: "stmp_trial_happy",
      payment_status: "finished",
      price_amount: 99,
    };

    const secret = process.env.NOWPAYMENTS_IPN_SECRET ?? "webhook-secret-x";
    const sig = signPayload(payload, secret);

    const req = new Request("http://localhost/api/webhooks/nowpayments", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nowpayments-sig": sig,
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
