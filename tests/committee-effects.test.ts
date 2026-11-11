import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { decisionIsFinal, effectPatch, parseEffect } from '../src/lib/committee-effects';
import { getMatchScore } from '../src/lib/format';
import { buildStandingsRows } from '../src/lib/standings-calculation';
const now = new Date('2026-11-11T18:00:00Z');
const initial = {id:'case',parentId:null,resolvedAt:new Date('2026-11-10T00:00:00Z'),status:'APROBADA',events:[{action:'RESOLUCION_NOTIFICADA',createdAt:new Date('2026-11-11T06:00:00Z')}]};
test('solo decisión notificada y firme; una revisión bloquea la aplicación inicial',()=>{
 assert.equal(decisionIsFinal(initial,null,now),true);
 assert.equal(decisionIsFinal(initial,null,new Date(now.getTime()-1)),false);
 assert.equal(decisionIsFinal({...initial,events:[]},null,now),false);
 assert.equal(decisionIsFinal(initial,{...initial,id:'review',parentId:'case',resolvedAt:null,status:'DEFENSA'},now),false);
 assert.equal(decisionIsFinal({...initial,parentId:'original'},null,now),true);
});
test('3-0 administrativo cambia puntos colectivos sin fabricar goles de jugadores',()=>{
 const teams=['a','b'].map(id=>({id,name:id,shortName:id,logoUrl:null,status:'ACTIVO'}));
 const match={homeTeamId:'a',awayTeamId:'b',forfeitedTeamId:null,goals:[{teamId:'a'},{teamId:'b'},{teamId:'b'}]};
 const before=buildStandingsRows(teams,[match],[],['PTS','DG','GF']);
 assert.equal(before[0].teamId,'b');
 const applied={...match,...effectPatch('LOCAL_3_0')!};
 assert.deepEqual(getMatchScore(applied),{home:3,away:0});
 const rows=buildStandingsRows(teams,[applied],[],['PTS','DG','GF']);
 assert.equal(rows[0].teamId,'a');assert.equal(rows[0].pts,3);assert.equal(rows[0].gf,3);assert.equal(rows[1].pts,0);
 assert.equal(applied.goals.length,3);
 assert.deepEqual(getMatchScore({...match,...effectPatch('VISITANTE_3_0')!}),{home:0,away:3});
});
test('anulación no es empate; conservar no borra el marcador anterior',()=>{
 assert.equal(effectPatch('ANULAR')?.status,'ANULADO_VENCIMIENTO');
 assert.equal(effectPatch('ANULAR_TECNICO')?.officialHomeScore,null);
 assert.equal(effectPatch('SIN_CAMBIO'),null);
 assert.throws(()=>parseEffect('VICTORIA_INVENTADA'));
 assert.throws(()=>parseEffect('__proto__'));
});
