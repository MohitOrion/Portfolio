// ---------------------------------------------------------------------------
//  Where the contact backend lives.
//
//  By default it's this same site: the functions in /api (api/contact.js,
//  api/auth/login.js), which Vercel deploys along with the pages.
//  To use a backend hosted somewhere else instead, set VITE_BACKEND_URL to its
//  base URL (in Vercel: Project → Settings → Environment Variables, then redeploy).
// ---------------------------------------------------------------------------

const external = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

/** Base URL of the API, e.g. "/api" or "https://my-api.example.com/api". */
export const API = external ? `${external}/api` : "/api";
