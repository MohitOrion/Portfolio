// ---------------------------------------------------------------------------
//  Sign-in for the private inbox.
//
//  There is one account: ADMIN_EMAIL + ADMIN_PASSWORD, set as environment
//  variables in Vercel. Signing in returns a token that lasts 7 days. The
//  token is signed with a key derived from the password, so changing the
//  password signs out every device.
// ---------------------------------------------------------------------------
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_DAYS = 7;

const adminEmail = () => (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const adminPassword = () => process.env.ADMIN_PASSWORD || "";

export const hasLogin = () => Boolean(adminEmail() && adminPassword());

function signingKey() {
  return createHash("sha256").update(`orion-inbox:${adminPassword()}:${process.env.INBOX_SECRET || ""}`).digest();
}

/** Compare two strings in constant time, so response timing reveals nothing. */
function sameText(a, b) {
  const ha = createHash("sha256").update(String(a)).digest();
  const hb = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export function checkCredentials(email, password) {
  if (!hasLogin()) return false;
  const emailOk = sameText(String(email || "").trim().toLowerCase(), adminEmail());
  const passwordOk = sameText(password || "", adminPassword());
  return emailOk && passwordOk;
}

const encode = (value) => Buffer.from(value).toString("base64url");

/** Token format: base64url(JSON payload) + "." + base64url(HMAC signature). */
export function createToken() {
  const payload = encode(JSON.stringify({ sub: adminEmail(), exp: Date.now() + TOKEN_DAYS * 86_400_000 }));
  const signature = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

/** True if the request carries a valid, unexpired "Authorization: Bearer <token>". */
export function isSignedIn(req) {
  if (!hasLogin()) return false;
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  if (!sameText(signature, expected)) return false;

  try {
    const { sub, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return sub === adminEmail() && Number(exp) > Date.now();
  } catch {
    return false;
  }
}
