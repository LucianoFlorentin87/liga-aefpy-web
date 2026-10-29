export const hoursAfter = (date: Date, hours: number) => new Date(date.getTime() + hours * 3600000);
export function panelValid(ids: string[], excluded: string[]) {
  return ids.length === 3 && new Set(ids).size === 3 && ids.every(id => !excluded.includes(id));
}
export function ballotResult(choices: (string | null)[]) {
  if (choices.length !== 3 || choices.some(c => c !== "APROBAR" && c !== "RECHAZAR")) return null;
  return choices.filter(c => c === "APROBAR").length >= 2 ? "APROBADA" : "RECHAZADA";
}
export function canReadCase(userId: string, applicantId: string, respondentId: string, panelIds: string[], operator: boolean) {
  return operator || userId === applicantId || userId === respondentId || panelIds.includes(userId);
}
export function visibleBallots<T extends { userId: string }>(ballots: T[], viewerId: string, panel: boolean, closed: boolean) {
  return panel ? ballots.filter(v => closed || v.userId === viewerId) : [];
}
