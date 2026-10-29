import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('migración privada: RLS, unicidad y registro inmutable en PostgreSQL aislado',async()=>{
 const db=new PGlite();
 try {
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
  await db.exec(await readFile('prisma/migrations/20261029150000_committee_cases/migration.sql','utf8'));
  const tables=await db.query<{relname:string;relrowsecurity:boolean}>("SELECT relname,relrowsecurity FROM pg_class WHERE relname LIKE 'committee_%' AND relkind='r'");
  assert.equal(tables.rows.length,5);assert.ok(tables.rows.every(t=>t.relrowsecurity));
  const grants=await db.query<{allowed:boolean}>("SELECT has_table_privilege('anon','committee_ballots','SELECT') AS allowed");assert.equal(grants.rows[0].allowed,false);
  await db.exec(`INSERT INTO committee_cases (id,"seasonId",title,"applicantId","respondentId","evidenceDeadline","updatedAt") VALUES ('case','season','Prueba','a','b',now(),now());
  INSERT INTO committee_ballots (id,"caseId","userId") VALUES ('vote','case','member');
  INSERT INTO committee_statements (id,"caseId","authorId",kind,body) VALUES ('proof','case','a','RECLAMO','Prueba original');`);
  await assert.rejects(db.exec(`INSERT INTO committee_ballots (id,"caseId","userId") VALUES ('duplicate','case','member')`));
  await assert.rejects(db.exec(`UPDATE committee_statements SET body='Alterada' WHERE id='proof'`),/append-only/);
  await assert.rejects(db.exec(`UPDATE committee_ballots SET choice='APROBAR',"votedAt"=now() WHERE id='vote'`));
  await db.exec(`UPDATE committee_ballots SET choice='APROBAR',reason='Fundamento',"votedAt"=now() WHERE id='vote'`);
  await assert.rejects(db.exec(`UPDATE committee_ballots SET choice='RECHAZAR' WHERE id='vote'`),/cannot be changed/);
  await assert.rejects(db.exec(`DELETE FROM committee_ballots WHERE id='vote'`),/cannot be changed/);
 } finally {await db.close();}
});
