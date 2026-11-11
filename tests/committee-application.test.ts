import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import type { Prisma } from '@prisma/client';
import { applyCommitteeDecision } from '../src/lib/committee-application';

// Run the actual application service against PostgreSQL, through a small
// Prisma-shaped adapter. SQL constraints/triggers and transaction rollback are real.
test('aplica, audita, protege y revisa sin borrar historial; repetir no duplica', async()=>{
 const db=new PGlite();
 try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
   CREATE TYPE "MatchStatus" AS ENUM ('PROGRAMADO','FINALIZADO');
   CREATE TABLE matches (id text PRIMARY KEY,"seasonId" text,"homeTeamId" text,"awayTeamId" text,status "MatchStatus","forfeitedTeamId" text);
   CREATE TABLE match_goals (id text PRIMARY KEY,"matchId" text);
   CREATE TABLE match_cards (id text PRIMARY KEY,"matchId" text);
   CREATE TABLE match_participations (id text PRIMARY KEY,"matchId" text);`);
  await db.exec(await readFile('prisma/migrations/20261029150000_committee_cases/migration.sql','utf8'));
  await db.exec(await readFile('prisma/migrations/20261111160000_committee_results/migration.sql','utf8'));
  await db.exec(`INSERT INTO matches VALUES ('match','season','a','b','FINALIZADO',null,null,null,null);
   INSERT INTO match_goals VALUES ('original-goal','match');
   INSERT INTO committee_cases (id,"seasonId","matchId",title,"applicantId","respondentId","evidenceDeadline","updatedAt",status,"proposedEffect","residualEffect","resolvedAt") VALUES
   ('case','season','match','Caso','a','b',now(),now(),'APROBADA','LOCAL_3_0','ANULAR',now());
   INSERT INTO committee_events (id,"caseId","actorId",action,detail,"createdAt") VALUES ('notice','case','staff','RESOLUCION_NOTIFICADA','Entregado','2026-11-10T00:00:00Z');`);
  let seq=0;
  const findCase=async({where}:{where:{id?:string;parentId?:string;seasonId:string}})=>{
   const {rows}=await db.query(`SELECT * FROM committee_cases WHERE ${where.id?'id':'"parentId"'}=$1 AND "seasonId"=$2`,[where.id??where.parentId,where.seasonId]);
   if(!rows[0])return null;
   const c=rows[0] as Record<string,unknown>;
   return {...c,events:(await db.query('SELECT * FROM committee_events WHERE "caseId"=$1',[c.id])).rows};
  };
  const tx={
   committeeCase:{findFirst:findCase,findFirstOrThrow:async(args:Parameters<typeof findCase>[0])=>{const c=await findCase(args);if(!c)throw Error('Not found');return c;}},
   committeeApplication:{findUnique:async({where}:{where:{caseId:string}})=>(await db.query('SELECT * FROM committee_applications WHERE "caseId"=$1',[where.caseId])).rows[0]??null,
    create:async({data}:{data:Record<string,unknown>})=>db.query('INSERT INTO committee_applications (id,"caseId","seasonId","matchId","actorId",effect,before,after) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',[`apply-${++seq}`,data.caseId,data.seasonId,data.matchId,data.actorId,data.effect,JSON.stringify(data.before),JSON.stringify(data.after)])},
   match:{findFirstOrThrow:async({where}:{where:{id:string;seasonId:string}})=>{const row=(await db.query('SELECT * FROM matches WHERE id=$1 AND "seasonId"=$2',[where.id,where.seasonId])).rows[0];if(!row)throw Error('Not found');return row;},
    update:async({where,data}:{where:{id:string};data:Record<string,unknown>})=>db.query('UPDATE matches SET status=$1,"officialHomeScore"=$2,"officialAwayScore"=$3,"forfeitedTeamId"=$4,"committeeCaseId"=$5 WHERE id=$6',[data.status,data.officialHomeScore,data.officialAwayScore,data.forfeitedTeamId,data.committeeCaseId,where.id])},
   committeeEvent:{create:async({data}:{data:Record<string,unknown>})=>db.query('INSERT INTO committee_events (id,"caseId","actorId",action,detail) VALUES ($1,$2,$3,$4,$5)',[`event-${++seq}`,data.caseId,data.actorId,data.action,data.detail])},
   $executeRaw:async()=>db.exec("SELECT set_config('aefpy.committee_application','on',true)"),
  } as unknown as Prisma.TransactionClient;
  const apply=async(id:string,date=new Date('2026-11-11T18:00:00Z'))=>{
   await db.exec('BEGIN');
   try{await applyCommitteeDecision(tx,id,'season','staff',date);await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
  };
  await assert.rejects(apply('case',new Date('2026-11-10T01:00:00Z')),/firme/);
  await apply('case');await apply('case');
  const score=(await db.query('SELECT * FROM matches')).rows[0] as Record<string,unknown>;
  assert.equal(score.status,'RESULTADO_ADMINISTRATIVO');assert.equal(score.officialHomeScore,3);assert.equal(score.officialAwayScore,0);
  assert.equal((await db.query('SELECT * FROM committee_applications')).rows.length,1);
  assert.equal((await db.query('SELECT * FROM match_goals')).rows.length,1);
  await assert.rejects(db.exec("UPDATE matches SET status='FINALIZADO' WHERE id='match'"),/protected/);
  await assert.rejects(db.exec("DELETE FROM match_goals WHERE id='original-goal'"),/protected/);
  await assert.rejects(db.exec('DELETE FROM committee_applications'),/append-only/);
  await assert.rejects(db.exec(`UPDATE committee_cases SET "proposedEffect"='VISITANTE_3_0' WHERE id='case'`),/immutable/);
  await db.exec(`INSERT INTO committee_cases (id,"seasonId","matchId",title,"applicantId","respondentId","evidenceDeadline","updatedAt",status,"proposedEffect","residualEffect","resolvedAt","parentId") VALUES
   ('review','season','match','Revision','b','a',now(),now(),'APROBADA','ANULAR_TECNICO','SIN_CAMBIO',now(),'case');
   INSERT INTO committee_events (id,"caseId","actorId",action,detail) VALUES ('review-notice','review','staff','RESOLUCION_NOTIFICADA','Entregado');`);
  await assert.rejects(apply('case'),/firme/);
  await apply('review');
  const reviewed=(await db.query('SELECT * FROM matches')).rows[0] as Record<string,unknown>;
  assert.equal(reviewed.status,'ANULADO_TECNICO');assert.equal(reviewed.officialHomeScore,null);
  assert.equal((await db.query('SELECT * FROM committee_applications')).rows.length,2);
  assert.equal((await db.query('SELECT * FROM match_goals')).rows.length,1);
  const privileges=await db.query<{allowed:boolean}>("SELECT has_table_privilege('anon','committee_applications','SELECT') AS allowed");assert.equal(privileges.rows[0].allowed,false);
 } finally {await db.close();}
});
