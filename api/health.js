// ---------------------------------------------------------------------------
//  /api/health
//
//    GET  → which parts of the contact backend are set up.
//  Open https://<your-site>/api/health after changing settings in Vercel.
//  It never reveals any secret values.
// ---------------------------------------------------------------------------
import { hasLogin } from "./_auth.js";
import { hasDatabase, query } from "./_db.js";
import { rejectMethod, send } from "./_http.js";
import { hasNotifications } from "./_notify.js";

export default async function handler(req, res) {
  if (rejectMethod(req, res, ["GET"])) return;

  let database = hasDatabase() ? "connected" : "missing DATABASE_URL";
  if (hasDatabase()) {
    try {
      await query("SELECT 1");
    } catch (error) {
      database = `can't connect: ${error.code || error.message}`;
    }
  }

  const passwordLength = (process.env.ADMIN_PASSWORD || "").length;
  const login = !hasLogin()
    ? "missing ADMIN_EMAIL or ADMIN_PASSWORD"
    : passwordLength < 12 ? "set, but use a longer password (12+ characters)" : "set";

  send(res, 200, {
    contactForm: database === "connected" ? "ready" : "not ready",
    database,
    inboxLogin: login,
    emailNotifications: hasNotifications() ? "on" : "off (optional: add RESEND_API_KEY)",
  });
}
