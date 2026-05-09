/**
 * PII log redaction — Phase 4 hardening (docs/13 §Phase 4 Task 6).
 *
 * Exports `scrubPii` for deep object redaction and `redactedLog` as a
 * drop-in wrapper around `console.log` that scrubs a metadata object
 * before writing to stdout.  All API routes that print customer data
 * MUST use these exports — raw customer email / pay_address / payout_hash
 * MUST never appear in plaintext logs.
 */

/** Keys whose values must be redacted in any log output. */
export const PII_FIELDS = new Set([
  "pay_address",
  "payout_hash",
  "payout_extra_id",
  "buyer_email",
  "buyer_name",
  "email",
  "customerEmail",
  "customer_email",
]);

/**
 * Deep-clone + redact.  Every value whose key is in `PII_FIELDS` is
 * replaced with `[REDACTED]`.  Nested objects are recursed; arrays
 * and primitives pass through unchanged.
 */
export function scrubPii(obj: Record<string, unknown>): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PII_FIELDS.has(key)) {
      scrubbed[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      scrubbed[key] = scrubPii(value as Record<string, unknown>);
    } else {
      scrubbed[key] = value;
    }
  }
  return scrubbed;
}

/**
 * `console.log` wrapper that scrubs PII from the optional metadata
 * object before printing.  Usage:
 *
 *   redactedLog("[MY_ROUTE] order=stmp_123", { customerEmail, licenceValidUntil });
 */
export function redactedLog(message: string, fields?: Record<string, unknown>): void {
  if (fields) {
    console.log(message, scrubPii(fields));
  } else {
    console.log(message);
  }
}
