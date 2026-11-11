export function expandIdentities(ids:string[],members:{userId:string;linkedUserId:string|null}[]) {
 const expanded=new Set(ids);
 // Closing the relation also handles a delegate account submitting a case
 // while the same person's other account is the designated committee member.
 let changed=true;
 while(changed){changed=false;for(const m of members){if(expanded.has(m.userId)||(m.linkedUserId&&expanded.has(m.linkedUserId))){for(const id of [m.userId,m.linkedUserId])if(id&&!expanded.has(id)){expanded.add(id);changed=true;}}}}
 return [...expanded];
}
