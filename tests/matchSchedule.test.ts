import { strict as assert } from "node:assert";
import { test } from "node:test";
import { upcomingScheduleFilter } from "../src/lib/matchSchedule";

test("usa el día de Asunción aunque UTC ya haya cambiado de fecha", () => {
  const { OR } = upcomingScheduleFilter(new Date("2026-10-28T01:30:00Z"));
  assert.equal(OR[0].date.gt.toISOString(), "2026-10-27T00:00:00.000Z");
  assert.equal(OR[1].time.gte, "22:30");
});
test("incluye desde medianoche local sin producir la hora 24", () => {
  const { OR } = upcomingScheduleFilter(new Date("2026-10-28T03:00:00Z"));
  assert.equal(OR[1].date.toISOString(), "2026-10-28T00:00:00.000Z");
  assert.equal(OR[1].time.gte, "00:00");
});
test("excluye días pasados y horas anteriores del mismo día", () => {
  const { OR } = upcomingScheduleFilter(new Date("2026-10-28T16:30:00Z"));
  const matches = [
    { date: "2026-09-14", time: "20:00" },
    { date: "2026-10-28", time: "12:00" },
    { date: "2026-10-28", time: "13:30" },
    { date: "2026-10-28", time: "20:00" },
    { date: "2026-10-29", time: "10:00" },
  ];
  const valid = matches.filter(match => {
    const date = new Date(match.date + "T00:00:00.000Z");
    return date > OR[0].date.gt || (+date === +OR[1].date && match.time >= OR[1].time.gte);
  });
  assert.deepEqual(valid.map(match => match.time), ["13:30", "20:00", "10:00"]);
});
