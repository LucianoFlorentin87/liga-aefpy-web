'use server';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { requireAuth } from '@/lib/permissions';
import { seasonAdminDb as db } from '@/lib/db';
import { REGULATION_VERSION,REGULATION_PDF,REGULATION_SHA256,ACCEPTANCE_TEXT } from '@/lib/regulation-policy';
import { revalidatePath } from 'next/cache';
export async function publishRegulation() {
 const {user,session}=await requireAuth();if(session.role!=='SUPERADMIN')throw new Error('Solo el superadministrador publica una versión.');
 const bytes=await readFile(path.join(process.cwd(),'public',REGULATION_PDF));
 if(createHash('sha256').update(bytes).digest('hex')!==REGULATION_SHA256)throw new Error('El PDF no coincide con la versión verificada.');
 await db.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(736527184)`;
  const settings=await tx.tournamentSettings.findUniqueOrThrow({where:{id:'settings'}});
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${settings.currentSeasonId!}), 4107)`;
  const season=await tx.season.findUniqueOrThrow({where:{id:settings.currentSeasonId!}});
  if(season.status!=='INSCRIPCION')throw new Error('Esta versión deportiva solo puede adoptarse antes de comenzar la edición.');
  if(await tx.regulationPublication.findUnique({where:{seasonId_version:{seasonId:season.id,version:REGULATION_VERSION}}}))return;
  await tx.regulationPublication.create({data:{seasonId:season.id,version:REGULATION_VERSION,pdfUrl:REGULATION_PDF,pdfSha256:REGULATION_SHA256,acceptanceText:ACCEPTANCE_TEXT.replace('AEFPY Clausura 2026',season.name),effectiveAt:new Date(),publishedById:user.id}});
  await tx.activityLog.create({data:{userId:user.id,message:`Publicación oficial del reglamento v${REGULATION_VERSION} para ${season.name}; documento ${REGULATION_SHA256}. Se exige aceptación expresa a cada delegado.`}});
 },{isolationLevel:'Serializable'});
 revalidatePath('/','layout');
}
