import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Prisma } from '@prisma/client';
import { assertReinstatementAllowed, reinstateRegistration } from '../src/lib/registration-reinstatement';

function fixture(accounts: Record<string, unknown>[] = []) {
  const originalDate = new Date('2026-11-13T12:00:00Z');
  const request = { id: 'original', seasonId: 'current', status: 'APROBADA', teamId: null as string | null, userId: null as string | null, teamName: 'Pilcomayo FBC', shortName: 'PIL', gamertag: 'game', delegateFirstName: 'Juan', delegateLastName: 'Petruquio', email: 'delegate@example.com', username: 'Petruquio', phone: '123456', reviewedAt: originalDate, reviewedById: 'first-reviewer', reviewNote: 'Original note', season: { status: 'INSCRIPCION', registrationOpen: true, registrationDeadline: null } };
  const teams: Record<string, unknown>[] = [], createdAccounts: Record<string, unknown>[] = [], logs: Record<string, unknown>[] = [];
  const tx = {
    $executeRaw: async () => 1, $queryRaw: async () => [],
    tournamentSettings: { findUniqueOrThrow: async () => ({ currentSeasonId: 'current' }) },
    leagueRegistration: { findUniqueOrThrow: async () => request, update: async ({ data }: { data: object }) => Object.assign(request, data) },
    role: { findUniqueOrThrow: async () => ({ id: 5 }) },
    team: { findFirst: async () => teams[0] ?? null, create: async ({ data }: { data: object }) => { const team = { id: 'new-team', ...data }; teams.push(team); return team; } },
    user: { findMany: async () => accounts, create: async ({ data }: { data: object }) => { const account = { id: 'recovered', ...data }; createdAccounts.push(account); return account; }, update: async ({ where, data }: { where: { id: string }; data: object }) => Object.assign(accounts.find(a => a.id === where.id)!, data) },
    activityLog: { create: async ({ data }: { data: Record<string, unknown> }) => { logs.push(data); return data; } },
  } as unknown as Prisma.TransactionClient;
  return { tx, request, teams, createdAccounts, logs, originalDate };
}

test('reincorporates the original approved request after account deletion without replacing its approval history', async () => {
  const f = fixture();
  const result = await reinstateRegistration(f.tx, 'original', 'admin', 'opaque-random-hash');
  assert.equal(result.recoveredAccount, true);
  assert.equal(f.teams.length, 1);
  assert.equal(f.createdAccounts[0].email, f.request.email);
  assert.equal(f.createdAccounts[0].username, f.request.username.toLowerCase(), 'login normalizes usernames to lowercase');
  assert.equal(f.createdAccounts[0].passwordHash, 'opaque-random-hash');
  assert.equal(f.request.id, 'original');
  assert.equal(f.request.reviewedAt, f.originalDate);
  assert.equal(f.request.reviewedById, 'first-reviewer');
  assert.equal(f.request.reviewNote, 'Original note');
  assert.equal(f.request.status, 'APROBADA');
  assert.equal(f.request.teamId, 'new-team');
  assert.equal(f.logs.length, 1);
  await assert.rejects(reinstateRegistration(f.tx, 'original', 'admin', 'other-hash'));
  assert.equal(f.teams.length, 1, 'repeating cannot create a second team');
});

test('preserves the existing delegate account and password', async () => {
  const account = { id: 'delegate', email: 'delegate@example.com', username: 'petruquio', status: 'ACTIVO', role: { key: 'DELEGADO' }, team: null, passwordHash: 'existing-password' };
  const f = fixture([account]);
  f.request.userId = account.id;
  assert.equal((await reinstateRegistration(f.tx, 'original', 'admin', 'unused-hash')).recoveredAccount, false);
  assert.equal(account.passwordHash, 'existing-password');
  assert.equal(f.createdAccounts.length, 0);
  assert.equal(f.request.userId, 'delegate');
});

test('rejects identity collisions, inactive accounts and delegates already assigned in this league', async () => {
  const valid = { id: 'delegate', email: 'delegate@example.com', username: 'petruquio', status: 'ACTIVO', role: { key: 'DELEGADO' }, team: null };
  for (const accounts of [
    [{ ...valid, email: 'someone-else@example.com' }],
    [{ ...valid, status: 'INACTIVO' }],
    [{ ...valid, role: { key: 'SUPERADMIN' } }],
    [{ ...valid, team: { seasonId: 'current' } }],
    [valid, { ...valid, id: 'different' }],
  ]) {
    const f = fixture(accounts);
    await assert.rejects(reinstateRegistration(f.tx, 'original', 'admin', 'hash'));
    assert.equal(f.teams.length, 0);
  }
});

test('reinstatement is restricted to orphaned approvals in open current-season registration', () => {
  const { request } = fixture();
  assert.doesNotThrow(() => assertReinstatementAllowed(request, 'current'));
  for (const candidate of [
    { ...request, status: 'RECHAZADA' }, { ...request, status: 'PENDIENTE' },
    { ...request, teamId: 'existing' }, { ...request, seasonId: 'historical' },
    { ...request, season: { ...request.season, status: 'EN_CURSO' } },
    { ...request, season: { ...request.season, registrationOpen: false } },
    { ...request, season: { ...request.season, registrationDeadline: new Date('2020-01-01') } },
  ]) assert.throws(() => assertReinstatementAllowed(candidate, 'current'));
});
