/** Alphabetical ordering before results exist is not a sporting ranking. */
export function hasCompetitiveStandings(rows: readonly { pj: number }[], seasonStatus?: string): boolean {
  return seasonStatus !== 'INSCRIPCION' && rows.some(row => row.pj > 0);
}
