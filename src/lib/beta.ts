/**
 * Private-beta gate. When BETA_PASSCODE is set, every page and API is locked
 * behind a signed cookie that only the passcode form can mint; unset means
 * the gate is open (self-hosters, local dev).
 *
 * Web Crypto only — this runs in the edge proxy and in node routes.
 */

export const BETA_COOKIE = "orqly-beta";

export function normalizePasscode(passcode: string): string {
  return passcode.trim().toUpperCase();
}

export function passcodeMatches(input: string): boolean {
  const expected = process.env.BETA_PASSCODE;
  if (!expected) return false;
  return normalizePasscode(input) === normalizePasscode(expected);
}

/** Cookie value: HMAC(passcode, BETTER_AUTH_SECRET) — unforgeable without the server secret. */
export async function betaCookieValue(): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.BETTER_AUTH_SECRET ?? ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(process.env.BETA_PASSCODE ?? ""),
  );
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function betaGateEnabled(): boolean {
  return !!process.env.BETA_PASSCODE;
}
