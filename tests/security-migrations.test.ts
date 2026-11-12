import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

function migration(name: string) {
  return readFileSync(new URL("../prisma/migrations/" + name + "/migration.sql", import.meta.url), "utf8");
}

test("security migrations apply to an isolated PostgreSQL-compatible database", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE TABLE public.users (id text PRIMARY KEY);
      CREATE TABLE public.notifications (id text PRIMARY KEY, "emailSentAt" timestamptz);
    `);
    for (const name of [
      "committee_guard_match", "committee_guard_sports_event", "committee_prevent_edits",
      "committee_protect_ballot", "committee_protect_case", "validate_regulation_acceptance",
    ]) {
      await db.exec(`CREATE FUNCTION public.${name}() RETURNS void LANGUAGE sql AS 'SELECT NULL::void'`);
    }
    await db.exec(migration("20261112200000_secure_trigger_search_path"));
    const paths = await db.query<{ proname: string; proconfig: string[] }>(`
      SELECT proname, proconfig FROM pg_proc
      WHERE pronamespace = 'public'::regnamespace
        AND proname IN ('committee_guard_match', 'committee_guard_sports_event',
          'committee_prevent_edits', 'committee_protect_ballot',
          'committee_protect_case', 'validate_regulation_acceptance')
    `);
    assert.equal(paths.rows.length, 6);
    for (const row of paths.rows) assert.ok(row.proconfig.includes("search_path=public, pg_temp"));
    await db.exec(migration("20261112210000_auth_attempt_limits"));
    await db.exec(migration("20261112220000_staff_session_revocation"));
    await db.exec(migration("20261112230000_notification_email_leases"));
    const rls = await db.query<{ relrowsecurity: boolean }>(
      "SELECT relrowsecurity FROM pg_class WHERE oid = 'public.auth_attempt_limits'::regclass"
    );
    assert.equal(rls.rows[0].relrowsecurity, true);
    const user = await db.query<{ sessionVersion: number }>(
      "INSERT INTO public.users (id) VALUES ('test') RETURNING \"sessionVersion\""
    );
    assert.equal(user.rows[0].sessionVersion, 0);
    const notification = await db.query<{ emailAttempts: number; emailClaimedAt: Date | null }>(
      "INSERT INTO public.notifications (id) VALUES ('test') RETURNING \"emailAttempts\", \"emailClaimedAt\""
    );
    assert.equal(notification.rows[0].emailAttempts, 0);
    assert.equal(notification.rows[0].emailClaimedAt, null);
    const limit = await db.query<{ attempts: number }>(`
      INSERT INTO public.auth_attempt_limits (key_hash, attempts, window_expires_at)
      VALUES ('key', 1, now() + interval '1 hour')
      ON CONFLICT (key_hash) DO UPDATE SET attempts = auth_attempt_limits.attempts + 1
      RETURNING attempts
    `);
    assert.equal(limit.rows[0].attempts, 1);
    const next = await db.query<{ attempts: number }>(`
      INSERT INTO public.auth_attempt_limits (key_hash, attempts, window_expires_at)
      VALUES ('key', 1, now() + interval '1 hour')
      ON CONFLICT (key_hash) DO UPDATE SET attempts = auth_attempt_limits.attempts + 1
      RETURNING attempts
    `);
    assert.equal(next.rows[0].attempts, 2);
    // A single conditional UPDATE is the atomic lease primitive.
    const lease = await db.query<{ id: string }>(`
      UPDATE public.notifications
      SET "emailClaimedAt" = now(), "emailAttempts" = "emailAttempts" + 1
      WHERE id = 'test' AND "emailSentAt" IS NULL AND "emailClaimedAt" IS NULL
      RETURNING id
    `);
    assert.equal(lease.rows.length, 1);
    const duplicateLease = await db.query<{ id: string }>(`
      UPDATE public.notifications
      SET "emailClaimedAt" = now(), "emailAttempts" = "emailAttempts" + 1
      WHERE id = 'test' AND "emailSentAt" IS NULL AND "emailClaimedAt" IS NULL
      RETURNING id
    `);
    assert.equal(duplicateLease.rows.length, 0);
  } finally {
    await db.close();
  }
});
