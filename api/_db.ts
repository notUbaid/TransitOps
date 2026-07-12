import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

let _sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!_sql) {
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL or POSTGRES_URL environment variable is required",
      );
    }
    _sql = neon(connectionString);
  }
  return _sql;
}
