// ---------------------------------------------------------------------------
//  /api/contact
//
//    POST    anyone        save a message from the contact form
//            body: { name, email, role_interest, message, website }
//            ("website" is a hidden trap field: real visitors leave it empty, bots fill it)
//    GET     signed in     list messages, newest first
//    DELETE  signed in     delete one message: /api/contact?id=123
// ---------------------------------------------------------------------------
import { CONTACT_TOPICS } from "../src/data.js";
import { isSignedIn } from "./_auth.js";
import { hasDatabase, query } from "./_db.js";
import { fail, ipHash, readJson, rejectMethod, send } from "./_http.js";
import { notifyNewMessage } from "./_notify.js";

const LIMITS = { name: 100, email: 200, message: 5000 };
const MAX_PER_WINDOW = 5;       // messages from one visitor...
const WINDOW_MINUTES = 15;      // ...per 15 minutes
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (rejectMethod(req, res, ["GET", "POST", "DELETE"])) return;
  if (!hasDatabase()) {
    return fail(res, 503, "The message service isn't set up yet (no DATABASE_URL).");
  }

  try {
    if (req.method === "POST") return await saveMessage(req, res);
    if (!isSignedIn(req)) return fail(res, 401, "Please sign in again.");
    if (req.method === "GET") return await listMessages(res);
    return await deleteMessage(req, res);
  } catch (error) {
    console.error("contact API error", error);
    return fail(res, 500, "Something went wrong on the server. Please try again.");
  }
}

async function saveMessage(req, res) {
  const body = await readJson(req);
  const clean = (value) => String(value ?? "").trim();
  const name = clean(body.name);
  const email = clean(body.email);
  const message = clean(body.message);
  const topic = CONTACT_TOPICS.includes(clean(body.role_interest)) ? clean(body.role_interest) : "General Inquiry";

  // Bots fill every field, including the invisible one. Pretend it worked.
  if (clean(body.website)) return send(res, 200, { ok: true });

  if (!name || name.length > LIMITS.name) return fail(res, 400, "Add your name (up to 100 characters).");
  if (!EMAIL_PATTERN.test(email) || email.length > LIMITS.email) return fail(res, 400, "Check your email address so I can reply.");
  if (!message || message.length > LIMITS.message) return fail(res, 400, "Add a message (up to 5,000 characters).");

  const visitor = ipHash(req);
  const recent = await query(
    `SELECT count(*)::int AS n FROM contact_messages WHERE ip_hash = $1 AND created_at > now() - make_interval(mins => $2)`,
    [visitor, WINDOW_MINUTES]
  );
  if (recent.rows[0].n >= MAX_PER_WINDOW) {
    return fail(res, 429, "You've sent several messages in a row. Please wait a few minutes, or email me directly.");
  }

  const { rows } = await query(
    `INSERT INTO contact_messages (name, email, role_interest, message, ip_hash)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [name, email, topic, message, visitor]
  );
  await notifyNewMessage({ name, email, role_interest: topic, message });
  return send(res, 201, { ok: true, id: rows[0].id });
}

async function listMessages(res) {
  const { rows } = await query(
    `SELECT id, name, email, role_interest, message, created_at AS timestamp
     FROM contact_messages ORDER BY created_at DESC LIMIT 500`
  );
  return send(res, 200, rows);
}

async function deleteMessage(req, res) {
  const id = Number(new URL(req.url, "http://localhost").searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, "Missing message id.");
  const { rowCount } = await query(`DELETE FROM contact_messages WHERE id = $1`, [id]);
  return rowCount ? send(res, 200, { ok: true }) : fail(res, 404, "That message was already deleted.");
}
