import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readdir, readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
test('toda la cadena de migraciones conserva la liga cerrada y aísla el historial',async()=>{
 const db=new PGlite();
 try {
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE TABLE _prisma_migrations (id text);');
  const migrations=(await readdir('prisma/migrations')).filter(n=>/^\d/.test(n)).sort();
  for(const migration of migrations){
   if(migration==='20261028170000_league_seasons'){
    await db.exec(`INSERT INTO tournament_settings(id,"standingsCriteria","rulesContent","updatedAt") VALUES ('settings','PTS,DG,GF','',now());`);
   }
   if(migration==='20261111160000_committee_results'){
    await db.exec(`INSERT INTO teams(id,name,"shortName",status,"updatedAt") VALUES ('a','A','A','ACTIVO',now()),('b','B','B','ACTIVO',now());
     INSERT INTO matches(id,matchday,date,time,venue,"homeTeamId","awayTeamId",status,"updatedAt") VALUES ('historical',1,now(),'12:00','Online','a','b','FINALIZADO',now());
     UPDATE seasons SET status='FINALIZADA',archive='{}'::jsonb,"endedAt"=now() WHERE id='liga-inicial';`);
   }
   await db.exec(await readFile('prisma/migrations/'+migration+'/migration.sql','utf8'));
  }
  assert.equal((await db.query<{status:string}>('SELECT status FROM matches WHERE id=\'historical\'')).rows[0].status,'FINALIZADO');
  await assert.rejects(db.exec('UPDATE matches SET "officialHomeScore"=3,"officialAwayScore"=0 WHERE id=\'historical\''));
  assert.equal((await db.query('SELECT * FROM committee_applications')).rows.length,0);
  // New edition fixture: no production users or acknowledgements are involved.
  await db.exec(`INSERT INTO seasons(id,name,slug,status) VALUES ('new-season','Nueva','nueva','INSCRIPCION');
   UPDATE tournament_settings SET "currentSeasonId"='new-season' WHERE id='settings';
   INSERT INTO roles(id,key,name,description) VALUES (100,'DELEGADO','Delegado','Prueba');
   INSERT INTO teams(id,name,"shortName",status,"updatedAt") VALUES ('new-team','Nuevo','NUE','ACTIVO',now());
   INSERT INTO users(id,"firstName","lastName",email,username,"passwordHash","roleId","teamId","updatedAt") VALUES ('delegate','Prueba','Local','test@example.invalid','testdelegate','not-a-login',100,'new-team',now());
   INSERT INTO regulation_publications(id,"seasonId",version,"pdfUrl","pdfSha256","acceptanceText","effectiveAt","publishedById") VALUES ('pub','new-season','1.1','/test.pdf',repeat('a',64),'Acepto',now(),'delegate');
   INSERT INTO regulation_acceptances(id,"publicationId","seasonId","userId",username,"delegateName","teamId","teamName") VALUES ('ack','pub','new-season','delegate','testdelegate','Prueba Local','new-team','Nuevo');`);
  await assert.rejects(db.exec(`UPDATE regulation_acceptances SET "acceptedAt"=now() WHERE id='ack'`),/append-only/);
  await assert.rejects(db.exec(`DELETE FROM regulation_acceptances WHERE id='ack'`),/append-only/);
  await assert.rejects(db.exec(`UPDATE regulation_publications SET "pdfSha256"=repeat('b',64) WHERE id='pub'`),/append-only/);
  await assert.rejects(db.exec(`INSERT INTO regulation_acceptances(id,"publicationId","seasonId","userId",username,"delegateName","teamId","teamName") VALUES ('duplicate','pub','new-season','delegate','testdelegate','Prueba Local','new-team','Nuevo')`),/unique/);
  await assert.rejects(db.exec(`INSERT INTO regulation_acceptances(id,"publicationId","seasonId","userId",username,"delegateName","teamId","teamName") VALUES ('wrong-edition','pub','liga-inicial','delegate','testdelegate','Prueba Local','new-team','Nuevo')`),/published edition/);
  const grants=await db.query<{allowed:boolean}>("SELECT has_table_privilege('anon','regulation_acceptances','SELECT') AS allowed");assert.equal(grants.rows[0].allowed,false);

 }finally{await db.close();}
});
