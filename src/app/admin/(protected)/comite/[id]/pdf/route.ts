import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { readCommitteeCase } from '@/lib/committee';
import { seasonAdminDb as db } from '@/lib/db';
import { renderResolutionPdf } from '@/lib/committee-pdf';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 const {record:c}=await readCommitteeCase(id);
 if(!c.resolvedAt||!c.resolution||!c.resolutionNumber)return new Response('Resolución todavía no disponible.',{status:409});
 const [settings,users,logo]=await Promise.all([
  db.tournamentSettings.findUnique({where:{id:'settings'},select:{orgName:true}}),
  db.user.findMany({where:{id:{in:[c.applicantId,c.respondentId]}},select:{id:true,username:true,team:{select:{name:true}}}}),
  readFile(path.join(process.cwd(),'public','logo-comite-aefpy.png')),
 ]);
 const name=(id:string)=>{const u=users.find(u=>u.id===id);return u?.team?.name??u?.username??'Participante';};
 const notice=c.events.find(e=>e.action==='RESOLUCION_NOTIFICADA');
 const bytes=await renderResolutionPdf({number:c.resolutionNumber,caseId:c.id,title:c.title,resolution:c.resolution,resolvedAt:c.resolvedAt,notificationAt:notice?.createdAt??null,parentId:c.parentId,applicant:name(c.applicantId),respondent:name(c.respondentId),organization:settings?.orgName??'Liga AEFPY'},logo);
 return new Response(Buffer.from(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Resolucion-${c.id}.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
