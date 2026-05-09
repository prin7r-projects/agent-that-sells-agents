/**
 * PII scrub audit — Phase 4 Task 7 (docs/13 §Phase 4).
 *
 * Asserts that `scrubPii` and `redactedLog` never emit plaintext
 * customer email or pay_address (or any other PII_FIELDS key).
 *
 * Run: pnpm -F landing test pii-scrub
 */

import { describe, it, expect, vi } from "vitest";
import { scrubPii, PII_FIELDS, redactedLog } from "@/lib/server/log-redact";

// ---------------------------------------------------------------------------
// scrubPii
// ---------------------------------------------------------------------------

describe("scrubPii", () => {
  it("redacts a top-level email field", () => {
    const input = { customerEmail: "alice@example.com", orderId: "stmp_123" };
    const output = scrubPii(input);
    expect(output.customerEmail).toBe("[REDACTED]");
    expect(output.orderId).toBe("stmp_123");
  });

  it("redacts pay_address", () => {
    const input = { pay_address: "0xDeadBeefCafe", orderId: "stmp_456" };
    const output = scrubPii(input);
    expect(output.pay_address).toBe("[REDACTED]");
    expect(output.orderId).toBe("stmp_456");
  });

  it("redacts payout_hash", () => {
    const input = { payout_hash: "a1b2c3d4e5f6", status: "paid" };
    const output = scrubPii(input);
    expect(output.payout_hash).toBe("[REDACTED]");
    expect(output.status).toBe("paid");
  });

  it("redacts nested email fields", () => {
    const input = {
      orderId: "stmp_nested",
      buyer: {
        buyer_email: "bob@secret.io",
        buyer_name: "Bob",
        details: { email: "bob@secret.io" },
      },
    };
    const output = scrubPii(input);
    const buyer = output.buyer as Record<string, unknown>;
    expect(buyer.buyer_email).toBe("[REDACTED]");
    expect(buyer.buyer_name).toBe("[REDACTED]");
    const details = buyer.details as Record<string, unknown>;
    expect(details.email).toBe("[REDACTED]");
  });

  it("passes through non-PII values unchanged", () => {
    const input = {
      order_id: "stmp_abc",
      payment_status: "finished",
      price_amount: 99,
      price_currency: "usd",
    };
    const output = scrubPii(input);
    expect(output).toEqual(input);
  });

  it("handles a real-shaped IPN payload", () => {
    // Mimics a NOWPayments IPN POST body
    const ipn = {
      payment_id: 6123456,
      invoice_id: 123456,
      payment_status: "finished",
      pay_address: "0xAbc123Def456",
      payin_extra_id: null,
      price_amount: 99,
      price_currency: "usd",
      pay_amount: 99.5,
      actually_paid: 0,
      pay_currency: "usdttrc20",
      order_id: "stmp_pro_upgrade_refCODE_ltest",
      order_description: "StampedAgents — Pro · Lot 042 · Anders",
      purchase_id: 789012,
      outcome_amount: 99,
      outcome_currency: "usdttrc20",
      payout_hash: "tx-abc-def-ghi",
      payout_extra_id: null,
      buyer_email: "customer@example.com",
      buyer_name: "Jane Doe",
    };

    const scrubbed = scrubPii(ipn);
    const s = JSON.stringify(scrubbed);

    // No plaintext PII values in output
    expect(s).not.toContain("customer@example.com");
    expect(s).not.toContain("Jane Doe");
    expect(s).not.toContain("0xAbc123Def456");
    expect(s).not.toContain("tx-abc-def-ghi");

    // [REDACTED] markers present for each PII field
    for (const field of PII_FIELDS) {
      if (field in ipn) {
        expect(scrubbed[field]).toBe("[REDACTED]");
      }
    }

    // Non-PII fields still intact
    expect(scrubbed.order_id).toBe(ipn.order_id);
    expect(scrubbed.payment_status).toBe(ipn.payment_status);
    expect(scrubbed.price_amount).toBe(ipn.price_amount);
  });
});

// ---------------------------------------------------------------------------
// redactedLog
// ---------------------------------------------------------------------------

describe("redactedLog", () => {
  it("calls console.log with the scrubbed metadata object", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    redactedLog("[TEST] order=stmp_1", {
      customerEmail: "test@example.com",
      orderId: "stmp_1",
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const [message, meta] = spy.mock.calls[0];
    expect(message).toBe("[TEST] order=stmp_1");
    expect((meta as Record<string, unknown>).customerEmail).toBe("[REDACTED]");
    expect((meta as Record<string, unknown>).orderId).toBe("stmp_1");

    spy.mockRestore();
  });

  it("calls console.log with only the message when no fields provided", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    redactedLog("[TEST] plain message");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe("[TEST] plain message");
    expect(spy.mock.calls[0].length).toBe(1);

    spy.mockRestore();
  });
});
