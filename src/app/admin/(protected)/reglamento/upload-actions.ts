'use server';
import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/permissions';
import { seasonAdminDb as db } from '@/lib/db';
import { saveRulesPdf } from '@/lib/upload';

export type PublishUploadState = { error?: string; success?: string };
const VERSION = /^([1-9]\d{0,2})\.([0-9]{1,3})$/;
const ACCEPTANCE = (version: string, season: string) =>
  `Declaro que tuve acceso al Reglamento Deportivo de Liga AEFPY, versión ${version}, y acepto sus reglas para mi participación en ${season}.`;

export async function publishUploadedRegulation(
  _previous: PublishUploadState, data: FormData,
): Promise<PublishUploadState> {
  const { user, session } = await requireAuth();
  if (session.role !== 'SUPERADMIN') return { error: 'Solo el superadministrador puede publicar reglamentos.' };
  const version = String(data.get('version') ?? '').trim();
  const match = VERSION.exec(version);
  if (!match) return { error: 'Indicá una versión como 1.2 (máximo tres dígitos por componente).' };
  if (data.get('confirm') !== 'on') return { error: 'Confirmá expresamente la publicación y la nueva aceptación.' };
  const file = data.get('rulesPdf');
  if (!(file instanceof File) || file.size === 0) return { error: 'Seleccioná un archivo PDF.' };
  if (file.type !== 'application/pdf' || file.size > 15 * 1024 * 1024) return { error: 'El archivo debe ser PDF y no superar 15 MB.' };
  // Validate PDF magic bytes before any database mutation or storage write.
  const { validatePdfSignature } = await import('@/lib/upload-signatures');
  try { await validatePdfSignature(file); } catch (error) {
    return { error: error instanceof Error ? error.message : 'PDF inválido.' };
  }
  const settings = await db.tournamentSettings.findUnique({ where: { id: 'settings' }, select: { currentSeasonId: true } });
  if (!settings?.currentSeasonId) return { error: 'No hay una edición activa configurada.' };
  const season = await db.season.findUnique({ where: { id: settings.currentSeasonId } });
  if (!season || season.status !== 'INSCRIPCION') return { error: 'Solo se puede publicar una nueva versión durante la inscripción.' };
  const publications = await db.regulationPublication.findMany({ where: { seasonId: season.id }, select: { version: true } });
  const number = Number(match[1]) * 1000 + Number(match[2]);
  if (publications.some(p => {
    const m = VERSION.exec(p.version);
    return p.version === version || (m && Number(m[1]) * 1000 + Number(m[2]) >= number);
  })) return { error: 'La nueva versión debe ser superior a todas las publicadas en esta edición.' };

  const hash = createHash('sha256').update(Buffer.from(await file.arrayBuffer())).digest('hex');
  let url: string;
  try { url = (await saveRulesPdf(file))!; } catch (error) {
    return { error: error instanceof Error ? error.message : 'No se pudo almacenar el PDF.' };
  }
  try {
    await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(736527184)`;
      const current = await tx.tournamentSettings.findUniqueOrThrow({ where: { id: 'settings' } });
      if (!current.currentSeasonId || current.currentSeasonId !== season.id) throw new Error('Cambió la edición activa; no se publicó.');
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${season.id}), 4107)`;
      const activeSeason = await tx.season.findUniqueOrThrow({ where: { id: season.id } });
      if (activeSeason.status !== 'INSCRIPCION') throw new Error('La inscripción ya terminó; no se publicó.');
      const existing = await tx.regulationPublication.findMany({ where: { seasonId: season.id }, select: { version: true } });
      if (existing.some(p => {
        const m = VERSION.exec(p.version);
        return p.version === version || (m && Number(m[1]) * 1000 + Number(m[2]) >= number);
      })) throw new Error('La versión ya existe o dejó de ser la más reciente.');
      await tx.regulationPublication.create({ data: {
        seasonId: season.id, version, pdfUrl: url, pdfSha256: hash,
        acceptanceText: ACCEPTANCE(version, season.name), effectiveAt: new Date(), publishedById: user.id,
      } });
      await tx.activityLog.create({ data: {
        userId: user.id, message: `Reglamento v${version} publicado para ${season.name}; SHA-256 ${hash}. Requiere nueva aceptación individual.`,
      } });
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No se pudo registrar la publicación. El archivo subido no está vigente.' };
  }
  revalidatePath('/reglamento');
  revalidatePath('/admin/reglamento');
  revalidatePath('/admin/aceptar-reglamento');
  return { success: `Versión ${version} publicada. Los delegados deberán aceptarla nuevamente.` };
}
