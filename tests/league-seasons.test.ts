import { strict as assert } from "node:assert";
import { test } from "node:test";
import { scopeLeagueArgs } from "../src/lib/season-scope";
import { registrationIsOpen, registrationSchema, registrationDeadlineFor, leagueSlug } from "../src/lib/league-validation";

test("mantiene el id único y agrega el ámbito sin permitir una liga ajena", () => {
  const result = scopeLeagueArgs("Team", "findUnique", { where: { id: "equipo-antiguo", seasonId: "anterior", AND: { status: "ACTIVO" } } }, "actual");
  assert.deepEqual(result, { where: { id: "equipo-antiguo", seasonId: "anterior", AND: [{ status: "ACTIVO" }, { seasonId: "actual" }] } });
});
test("goles, tarjetas, participaciones y predicciones se filtran por la liga del partido", () => {
  for (const model of ["MatchGoal", "MatchCard", "MatchParticipation", "Prediction"]) {
    const scoped = scopeLeagueArgs(model, "count", { where: { match: { status: "FINALIZADO" } } }, "nueva");
    assert.deepEqual(scoped, { where: { match: { status: "FINALIZADO" }, AND: [{ match: { seasonId: "nueva" } }] } });
  }
});
test("altas y lotes no pueden elegir una liga distinta", () => {
  assert.deepEqual(scopeLeagueArgs("Team", "create", { data: { name: "Club", seasonId: "otra" } }, "actual"), { data: { name: "Club", seasonId: "actual" } });
  assert.deepEqual(scopeLeagueArgs("Player", "createMany", { data: [{ teamId: "a" }, { teamId: "b", seasonId: "otra" }] }, "actual"), { data: [{ teamId: "a", seasonId: "actual" }, { teamId: "b", seasonId: "actual" }] });
});
test("usuarios y roles no se mezclan con los registros deportivos", () => {
  assert.deepEqual(scopeLeagueArgs("User", "findUnique", { where: { id: "delegado" } }, "liga"), { where: { id: "delegado" } });
});
test("inscripción solo en fase abierta y antes de la fecha límite", () => {
  const now = new Date("2026-10-28T16:00:00Z");
  const season = { status: "INSCRIPCION", registrationOpen: true, registrationDeadline: new Date("2026-10-29T00:00:00Z") };
  assert.equal(registrationIsOpen(season, now), true);
  assert.equal(registrationIsOpen({ ...season, status: "EN_CURSO" }, now), false);
  assert.equal(registrationIsOpen({ ...season, status: "FINALIZADA" }, now), false);
  assert.equal(registrationIsOpen({ ...season, registrationOpen: false }, now), false);
  assert.equal(registrationIsOpen({ ...season, registrationDeadline: now }, now), false);
});
test("fecha límite usa el día completo de Paraguay y rechaza fechas inexistentes", () => {
  assert.equal(registrationDeadlineFor("2026-10-31")?.toISOString(), "2026-11-01T02:59:59.999Z");
  assert.equal(registrationDeadlineFor("2026-02-30"), null);
  assert.equal(registrationDeadlineFor("basura"), null);
});
test("normaliza datos y exige consentimiento", () => {
  const input = { seasonId: "liga", teamName: "Club", shortName: "cfc", gamertag: "Player", firstName: "Luciano", lastName: "Prueba", email: "DELEGADO@example.invalid", phone: "0981000000", username: "delegado", consent: true };
  const parsed = registrationSchema.parse(input);
  assert.equal(parsed.email, "delegado@example.invalid");
  assert.equal(parsed.shortName, "CFC");
  assert.equal(registrationSchema.safeParse({ ...input, consent: false }).success, false);
  assert.equal(leagueSlug("Liga Apertura / Paraguay", "abc123"), "liga-apertura-paraguay-abc123");
});
