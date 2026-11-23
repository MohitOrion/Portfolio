// ---------------------------------------------------------------------------
//  Optional contact backend.
//
//  If you run the API that stores contact messages, set VITE_BACKEND_URL to its
//  base URL (in Vercel: Project → Settings → Environment Variables, then redeploy).
//  For local development, copy .env.example to .env.
//
//  With it set:   the contact form POSTs to  {VITE_BACKEND_URL}/api/contact
//                 and /inbox signs in with   {VITE_BACKEND_URL}/api/auth/login
//  Without it:    the contact form opens the visitor's email app instead.
// ---------------------------------------------------------------------------

const raw = import.meta.env.VITE_BACKEND_URL || "";

/** Base URL of the API, e.g. "https://my-api.example.com/api", or "" when there is no backend. */
export const API = raw ? `${raw.replace(/\/+$/, "")}/api` : "";
