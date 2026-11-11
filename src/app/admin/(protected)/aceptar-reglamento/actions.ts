'use server';
import { requireAuth } from '@/lib/permissions';
import { seasonAdminDb as db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { validateAcknowledgement } from '@/lib/regulation-policy';
export async function acceptRegulation(form:FormData) {
 const {user,session}=await requireAuth();
 if(session.role!=='DELEGADO') throw new Error('La aceptación corresponde al delegado con su propia cuenta.');
 let error='';
 try{
 await db.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(736527184)`;
  const settings=await tx.tournamentSettings.findUniqueOrThrow({where:{id:'settings'}});
  if(!settings.currentSeasonId)throw new Error('No hay una edición activa.');
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${settings.currentSeasonId}), 4107)`;
  const publication=await tx.regulationPublication.findFirst({where:{seasonId:settings.currentSeasonId!,effectiveAt:{lte:new Date()}},orderBy:[{effectiveAt:'desc'},{publishedAt:'desc'}]});
  if(!publication) throw new Error('No hay una versión vigente para aceptar.');
  validateAcknowledgement(form.get('accept'),form.get('publicationId'),publication.id);
  const actor=await tx.user.findUniqueOrThrow({where:{id:user.id},include:{role:true,team:true}});
  if(actor.status!=='ACTIVO'||actor.role.key!=='DELEGADO'||!actor.team||actor.team.seasonId!==publication.seasonId) throw new Error('Tu cuenta debe representar un equipo de esta edición.');
  if(await tx.regulationAcceptance.findUnique({where:{publicationId_userId:{publicationId:publication.id,userId:user.id}}})) return;
  await tx.regulationAcceptance.create({data:{publicationId:publication.id,seasonId:publication.seasonId,userId:user.id,username:actor.username,delegateName:`${actor.firstName} ${actor.lastName}`,teamId:actor.team.id,teamName:actor.team.name}});
  await tx.activityLog.create({data:{userId:user.id,message:`Aceptación expresa del reglamento v${publication.version}; edición ${publication.seasonId}; documento SHA-256 ${publication.pdfSha256}.`}});
 },{isolationLevel:'Serializable'});
 }catch(e){error=e instanceof Error && !('code' in e)?e.message:'No se pudo registrar. Actualizá y volvé a intentar.';}
 if(error)redirect('/admin/aceptar-reglamento?error='+encodeURIComponent(error));
 revalidatePath('/admin','layout');redirect('/admin/mi-equipo');
}
