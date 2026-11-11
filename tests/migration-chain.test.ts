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
 }finally{await db.close();}
});
