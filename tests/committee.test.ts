import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {panelValid,ballotResult,canReadCase,visibleBallots,hoursAfter} from '../src/lib/committee-policy';
test('quórum exige tres identidades diferentes sin partes involucradas',()=>{
 assert.equal(panelValid(['a','b'],[]),false);assert.equal(panelValid(['a','b','b'],[]),false);
 assert.equal(panelValid(['a','b','c'],['c']),false);assert.equal(panelValid(['a','b','c'],['x']),true);
});
test('dos votos no cierran aunque ambos aprueben; tres válidos y mayoría sí',()=>{
 assert.equal(ballotResult(['APROBAR','APROBAR',null]),null);
 assert.equal(ballotResult(['APROBAR','APROBAR','ABSTENCION']),null);
 assert.equal(ballotResult(['APROBAR','APROBAR','RECHAZAR']),'APROBADA');
 assert.equal(ballotResult(['APROBAR','RECHAZAR','RECHAZAR']),'RECHAZADA');
});
test('terceros y delegados ajenos no leen expedientes',()=>{
 assert.equal(canReadCase('intruso','a','b',['c','d','e'],false),false);
 assert.equal(canReadCase('b','a','b',['c','d','e'],false),true);
});
test('votos nunca salen a las partes; durante ronda ni siquiera a otros votantes',()=>{
 const votes=[{userId:'a',reason:'privado'},{userId:'b',reason:'reservado'}];
 assert.deepEqual(visibleBallots(votes,'delegado',false,true),[]);
 assert.equal(visibleBallots(votes,'a',true,false).length,1);
 assert.equal(visibleBallots(votes,'a',true,true).length,2);
});
test('plazos usan horas corridas sin depender de zona del servidor',()=>{
 assert.equal(hoursAfter(new Date('2026-10-29T23:00:00-03:00'),24).toISOString(),'2026-10-31T02:00:00.000Z');
});
