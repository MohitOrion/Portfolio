// ---------------------------------------------------------------------------
//  Database connection for the contact backend (Vercel Functions).
//
//  Uses any Postgres database. On Vercel, connecting a Neon database under
//  Storage sets DATABASE_URL automatically. The table is created on first use.
// ---------------------------------------------------------------------------
import pg from "pg";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS contact_messages (
    id            BIGSERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL,
    role_interest TEXT NOT NULL,
    message       TEXT NOT NULL,
    ip_hash       TEXT,                          -- hashed, only used for rate limiting
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON contact_messages (created_at DESC);
`;

let pool = null;
let schemaReady = null;

export const hasDatabase = () => Boolean(connectionString);

/** Run a SQL query with $1, $2… parameters. Creates the table the first time. */
export async function query(text, params = []) {
  if (!pool) {
    // Serverless functions handle one request at a time, so one connection is enough.
    pool = new pg.Pool({ connectionString, max: 1, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000 });
  }
  if (!schemaReady) {
    schemaReady = pool.query(SCHEMA).catch((error) => {
      schemaReady = null; // try again on the next request
      throw error;
    });
  }
  await schemaReady;
  return pool.query(text, params);
}
