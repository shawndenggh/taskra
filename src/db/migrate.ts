import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

import { createPostgresPool } from "./postgres.js";

type Migration = {
  id: string;
  sql: string;
};

async function loadMigrations(migrationsDir: string): Promise<Migration[]> {
  const entries = await readdir(migrationsDir);
  const migrationFiles = entries.filter((entry) => entry.endsWith(".sql")).sort();

  return Promise.all(
    migrationFiles.map(async (fileName) => ({
      id: fileName,
      sql: await readFile(path.join(migrationsDir, fileName), "utf8"),
    })),
  );
}

export async function runMigrations(databaseUrl: string): Promise<string[]> {
  const pool = createPostgresPool(databaseUrl);
  const applied: string[] = [];

  try {
    await pool.query(`
      create table if not exists taskra_migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const migrations = await loadMigrations(path.resolve(import.meta.dirname, "../../migrations"));

    for (const migration of migrations) {
      await pool.query("begin");
      try {
        const existing = await pool.query("select id from taskra_migrations where id = $1", [
          migration.id,
        ]);

        if (existing.rowCount === 0) {
          const sql = migration.sql.trim();
          if (sql.length > 0) {
            await pool.query(sql);
          }
          await pool.query("insert into taskra_migrations (id) values ($1)", [migration.id]);
          applied.push(migration.id);
        }

        await pool.query("commit");
      } catch (error) {
        await pool.query("rollback");
        throw error;
      }
    }
  } finally {
    await pool.end();
  }

  return applied;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    process.stderr.write("DATABASE_URL is required to run migrations.\n");
    process.exitCode = 1;
    return;
  }

  const applied = await runMigrations(databaseUrl);
  if (applied.length === 0) {
    process.stdout.write("No migrations to apply.\n");
    return;
  }

  process.stdout.write(`Applied migrations: ${applied.join(", ")}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
