import 'server-only';
import { seasonAdminDb as db, getCurrentSeasonId } from '@/lib/db';
export async function currentRegulation(seasonId?:string) {
 return db.regulationPublication.findFirst({where:{seasonId:seasonId??await getCurrentSeasonId(),effectiveAt:{lte:new Date()}},orderBy:[{effectiveAt:'desc'},{publishedAt:'desc'}]});
}
export async function delegateRegulationState(userId:string,seasonId?:string) {
 const publication=await currentRegulation(seasonId);
 const acceptance=publication?await db.regulationAcceptance.findUnique({where:{publicationId_userId:{publicationId:publication.id,userId}}}):null;
 return {publication,acceptance};
}
