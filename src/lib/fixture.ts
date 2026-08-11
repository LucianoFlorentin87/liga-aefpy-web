import "server-only";

export type FixturePair = { homeTeamId: string; awayTeamId: string };

/**
 * Genera un fixture de todos contra todos, ida y vuelta (Art. 1 del
 * reglamento de la Liga AEFPY), usando el método del círculo.
 *
 * Devuelve un array de jornadas; cada jornada es un array de partidos
 * (par local/visitante). Con N equipos hay (N-1) jornadas en la ida y
 * otras tantas en la vuelta (con los locales invertidos); si N es impar
 * se agrega un "descanso" (bye) por jornada.
 */
export function generateDoubleRoundRobin(teamIds: string[]): FixturePair[][] {
  const teams: (string | null)[] = [...teamIds];
  if (teams.length % 2 !== 0) teams.push(null); // bye

  const n = teams.length;
  const roundsCount = n - 1;
  const firstLeg: FixturePair[][] = [];

  const rotating = teams.slice(1);
  const fixed = teams[0];

  for (let round = 0; round < roundsCount; round++) {
    const arrangement = [fixed, ...rotating];
    const pairs: FixturePair[] = [];

    for (let i = 0; i < n / 2; i++) {
      const a = arrangement[i];
      const b = arrangement[n - 1 - i];
      if (a === null || b === null) continue;
      // Alterna quién es local para repartir localías entre rondas.
      const [home, away] = round % 2 === 0 ? [a, b] : [b, a];
      pairs.push({ homeTeamId: home, awayTeamId: away });
    }

    firstLeg.push(pairs);
    rotating.unshift(rotating.pop()!);
  }

  const secondLeg = firstLeg.map((round) =>
    round.map(({ homeTeamId, awayTeamId }) => ({ homeTeamId: awayTeamId, awayTeamId: homeTeamId })),
  );

  return [...firstLeg, ...secondLeg];
}
