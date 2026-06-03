/**
 * Regression test for PRI-3800: /api/internal/ipn authentication.
 *
 * Covers:
 *   - Unauthenticated POST → 401
 *   - Invalid Bearer token → 401
 *   - Valid Bearer token → 200 (with orderId validation)
 *   - Missing INTERNAL_IPN_SECRET → all requests rejected (safe-fallback)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("POST /api/internal/ipn", () => {
  it("rejects unauthenticated requests with 401", async () => {
    vi.stubEnv("INTERNAL_IPN_SECRET", "test-secret-xyz");

    const { POST } = await import("@/app/api/internal/ipn/route");

    const req = new Request("http://localhost/api/internal/ipn", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId: "test-order-123",
        paymentStatus: "finished",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBeDefined();
    expect((body.error as Record<string, unknown>).code).toBe("unauthorized");
  });

  it("rejects requests with invalid Bearer token", async () => {
    vi.stubEnv("INTERNAL_IPN_SECRET", "test-secret-xyz");

    const { POST } = await import("@/app/api/internal/ipn/route");

    const req = new Request("http://localhost/api/internal/ipn", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer wrong-secret",
      },
      body: JSON.stringify({
        orderId: "test-order-123",
        paymentStatus: "finished",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("rejects requests with malformed Authorization header", async () => {
    vi.stubEnv("INTERNAL_IPN_SECRET", "test-secret-xyz");

    const { POST } = await import("@/app/api/internal/ipn/route");

    const req = new Request("http://localhost/api/internal/ipn", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Basic dXNlcjpwYXNz", // Base64 user:pass
      },
      body: JSON.stringify({
        orderId: "test-order-123",
        paymentStatus: "finished",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("rejects all requests when INTERNAL_IPN_SECRET is not set (safe-fallback)", async () => {
    vi.stubEnv("INTERNAL_IPN_SECRET", "");
    delete process.env.INTERNAL_IPN_SECRET;

    const { POST } = await import("@/app/api/internal/ipn/route");

    const req = new Request("http://localhost/api/internal/ipn", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer any-token",
      },
      body: JSON.stringify({
        orderId: "test-order-123",
        paymentStatus: "finished",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("accepts requests with valid Bearer token but requires orderId", async () => {
    vi.stubEnv("INTERNAL_IPN_SECRET", "test-secret-xyz");

    const { POST } = await import("@/app/api/internal/ipn/route");

    const req = new Request("http://localhost/api/internal/ipn", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer test-secret-xyz",
      },
      body: JSON.stringify({
        paymentStatus: "finished",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBeDefined();
    expect((body.error as Record<string, unknown>).code).toBe("bad_request");
  });

  it("accepts authenticated requests and returns unknown status for unrecognized orderId", async () => {
    vi.stubEnv("INTERNAL_IPN_SECRET", "test-secret-xyz");

    const { POST } = await import("@/app/api/internal/ipn/route");

    const req = new Request("http://localhost/api/internal/ipn", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer test-secret-xyz",
      },
      body: JSON.stringify({
        orderId: "nonexistent-order-456",
        paymentStatus: "pending",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(body.orderId).toBe("nonexistent-order-456");
    expect(body.status).toBe("pending");
  });
});
