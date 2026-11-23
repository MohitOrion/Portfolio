// ---------------------------------------------------------------------------
//  /api/auth/login
//
//    POST  { email, password }  →  { token }   (sign in to the inbox)
// ---------------------------------------------------------------------------
import { checkCredentials, createToken, hasLogin } from "../_auth.js";
import { fail, readJson, rejectMethod, send, sleep } from "../_http.js";

export default async function handler(req, res) {
  if (rejectMethod(req, res, ["POST"])) return;
  if (!hasLogin()) {
    return fail(res, 503, "The inbox isn't set up yet. Add ADMIN_EMAIL and ADMIN_PASSWORD in Vercel, then redeploy.");
  }

  const { email, password } = await readJson(req);
  if (!checkCredentials(email, password)) {
    await sleep(700); // slows down password guessing
    return fail(res, 401, "Invalid email or password.");
  }
  return send(res, 200, { token: createToken() });
}
