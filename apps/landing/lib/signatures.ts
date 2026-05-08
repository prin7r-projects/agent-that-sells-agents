import crypto from "node:crypto";

export function timingSafeEqualHex(left: string, right: string) {
  const a = left.trim().toLowerCase();
  const b = right.trim().toLowerCase();
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

export function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObject((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * NOWPayments IPN signature.
 * The header `x-nowpayments-sig` is HMAC-SHA512 of a JSON-serialized
 * payload with keys sorted alphabetically (deep), using the IPN secret.
 */
export function verifyNowpaymentsIpn(
  payload: unknown,
  signature: string | null,
  secret: string,
) {
  if (!signature) return false;
  const sorted = JSON.stringify(sortObject(payload));
  const expected = crypto
    .createHmac("sha512", secret.trim())
    .update(sorted)
    .digest("hex");
  return timingSafeEqualHex(expected, signature);
}
