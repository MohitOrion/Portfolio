// ---------------------------------------------------------------------------
//  Small request/response helpers shared by the API endpoints.
//  Errors use FastAPI's { detail: "..." } shape, which the site already reads.
// ---------------------------------------------------------------------------
import { createHash } from "node:crypto";

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export const fail = (res, status, detail) => send(res, status, { detail });

/** Reply 405 unless the request uses one of the allowed methods. Returns true if handled. */
export function rejectMethod(req, res, allowed) {
  if (allowed.includes(req.method)) return false;
  res.setHeader("Allow", allowed.join(", "));
  fail(res, 405, `This endpoint accepts: ${allowed.join(", ")}.`);
  return true;
}

/** The JSON request body as an object ({} if missing or invalid). */
export async function readJson(req) {
  // Vercel parses JSON bodies into req.body; a plain Node server leaves the stream unread.
  let body = req.body;
  if (body === undefined) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 64 * 1024) return {}; // ignore anything absurdly large
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks).toString("utf8");
  }
  if (typeof body === "string") {
    try { body = JSON.parse(body || "{}"); } catch { return {}; }
  }
  return body && typeof body === "object" ? body : {};
}

/** A one-way hash of the visitor's IP address, used only to limit message floods. */
export function ipHash(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = forwarded || req.socket?.remoteAddress || "unknown";
  const salt = process.env.ADMIN_PASSWORD || "orion";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
