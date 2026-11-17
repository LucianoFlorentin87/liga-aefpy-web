import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasCompetitiveStandings } from '../src/lib/standings-presentation';

test('registration and zero matches cannot produce sporting positions', () => {
  assert.equal(hasCompetitiveStandings([{ pj: 0 }, { pj: 0 }], 'INSCRIPCION'), false);
  assert.equal(hasCompetitiveStandings([{ pj: 1 }], 'INSCRIPCION'), false);
  assert.equal(hasCompetitiveStandings([{ pj: 0 }], 'EN_CURSO'), false);
  assert.equal(hasCompetitiveStandings([], 'EN_CURSO'), false);
  assert.equal(hasCompetitiveStandings([{ pj: 0 }]), false);
});

test('played matches enable positions in an ongoing or finished league', () => {
  assert.equal(hasCompetitiveStandings([{ pj: 0 }, { pj: 1 }], 'EN_CURSO'), true);
  assert.equal(hasCompetitiveStandings([{ pj: 4 }], 'FINALIZADA'), true);
  assert.equal(hasCompetitiveStandings([{ pj: 4 }]), true);
});
