import pg from "pg";

const { Pool } = pg;

export function createPostgresPool(databaseUrl: string): pg.Pool {
  return new Pool({ connectionString: databaseUrl });
}
