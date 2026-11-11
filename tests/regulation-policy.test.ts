import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { classifyClaim,validateAcknowledgement } from '../src/lib/regulation-policy';
import { expandIdentities } from '../src/lib/committee-conflicts';
test('clasifica naturaleza/artículo y rechaza valores inventados o incompatibles',()=>{
 assert.deepEqual(classifyClaim('COORDINACION','4'),{nature:'COORDINACION',article:4});
 assert.throws(()=>classifyClaim('COORDINACION','9'));
 assert.throws(()=>classifyClaim('__proto__','4'));
 assert.throws(()=>classifyClaim('OTRO','0'));
 assert.throws(()=>classifyClaim('OTRO','4.5'));
});
test('aceptación requiere casilla expresa y la versión exacta mostrada',()=>{
 assert.throws(()=>validateAcknowledgement(null,'pub','pub'));
 assert.throws(()=>validateAcknowledgement('on','anterior','vigente'));
 assert.doesNotThrow(()=>validateAcknowledgement('on','vigente','vigente'));
});
test('dos cuentas de una persona comparten exclusión por conflicto y revisión',()=>{
 const links=[{userId:'admin',linkedUserId:'luciano'},{userId:'ivan',linkedUserId:null}];
 assert.deepEqual(new Set(expandIdentities(['luciano'],links)),new Set(['luciano','admin']));
 assert.deepEqual(new Set(expandIdentities(['admin'],links)),new Set(['luciano','admin']));
 assert.deepEqual(expandIdentities(['justo'],links),['justo']);
});
