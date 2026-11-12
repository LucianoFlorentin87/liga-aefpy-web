import "server-only";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";

// Postgres atomic upsert works across Render instances and process restarts.
// A hashed identifier avoids retaining emails/usernames in the throttle table.
function digest(scope: string, identifier: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SECRET debe tener al menos 16 caracteres.");
  return createHmac("sha256", secret).update(scope + ":" + identifier.trim().toLowerCase()).digest("hex");
}

export async function consumeAuthAttempt(
  scope: "staff-login" | "staff-reset",
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const key = digest(scope, identifier);
  const rows = await prisma.$queryRaw<{ attempts: number }[]>`
    INSERT INTO public.auth_attempt_limits (key_hash, attempts, window_expires_at)
    VALUES (${key}, 1, now() + (${windowSeconds} * interval '1 second'))
    ON CONFLICT (key_hash) DO UPDATE SET
      attempts = CASE
        WHEN auth_attempt_limits.window_expires_at <= now() THEN 1
        ELSE LEAST(auth_attempt_limits.attempts + 1, ${limit} + 1)
      END,
      window_expires_at = CASE
        WHEN auth_attempt_limits.window_expires_at <= now()
        THEN now() + (${windowSeconds} * interval '1 second')
        ELSE auth_attempt_limits.window_expires_at
      END
    RETURNING attempts
  `;
  return rows[0]?.attempts <= limit;
}

export async function clearAuthAttempts(scope: "staff-login" | "staff-reset", identifier: string) {
  const key = digest(scope, identifier);
  await prisma.$executeRaw`DELETE FROM public.auth_attempt_limits WHERE key_hash = ${key}`;
}
