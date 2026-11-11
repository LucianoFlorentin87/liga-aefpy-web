import { seasonAdminDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

/** Readiness check for external monitoring; no credentials or sports data leave the server. */
export async function GET() {
  const headers = { 'Cache-Control': 'no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' };
  try {
    // Read actual application state: catches missing schema/settings as well as connection failure.
    const settings = await seasonAdminDb.tournamentSettings.findUnique({
      where: { id: 'settings' }, select: { currentSeasonId: true },
    });
    if (!settings?.currentSeasonId) throw new Error('Application not ready');
    return Response.json({ status: 'ok' }, { headers });
  } catch {
    return Response.json({ status: 'unavailable' }, { status: 503, headers });
  }
}
