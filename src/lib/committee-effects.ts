import type { MatchStatus } from '@prisma/client';

export const EFFECTS = {
  SIN_CAMBIO: 'Conservar el resultado registrado',
  LOCAL_3_0: 'Victoria administrativa del local 3-0',
  VISITANTE_3_0: 'Victoria administrativa del visitante 0-3',
  ANULAR: 'Anular partido no disputado, sin puntos ni goles',
  ANULAR_TECNICO: 'Anulación técnica, sin puntos ni goles',
} as const;
export type CommitteeEffect = keyof typeof EFFECTS;
export function parseEffect(value: unknown): CommitteeEffect {
  if (typeof value !== 'string' || !Object.hasOwn(EFFECTS, value)) throw new Error('Seleccioná el efecto deportivo completo antes de votar.');
  return value as CommitteeEffect;
}
export function effectLabel(value: string | null) {
  return value && Object.hasOwn(EFFECTS, value) ? EFFECTS[value as CommitteeEffect] : 'Aplicación manual: propuesta anterior a esta integración';
}
export function effectPatch(effect: CommitteeEffect): { status: MatchStatus; officialHomeScore: number | null; officialAwayScore: number | null; forfeitedTeamId: null } | null {
  if (effect === 'SIN_CAMBIO') return null;
  return {
    status: effect === 'LOCAL_3_0' || effect === 'VISITANTE_3_0' ? 'RESULTADO_ADMINISTRATIVO' : effect === 'ANULAR' ? 'ANULADO_VENCIMIENTO' : 'ANULADO_TECNICO',
    officialHomeScore: effect === 'LOCAL_3_0' ? 3 : effect === 'VISITANTE_3_0' ? 0 : null,
    officialAwayScore: effect === 'LOCAL_3_0' ? 0 : effect === 'VISITANTE_3_0' ? 3 : null,
    forfeitedTeamId: null,
  };
}
type Decision = { id: string; parentId: string | null; resolvedAt: Date | null; status: string; events: { action: string; createdAt: Date }[] };
export function decisionIsFinal(c: Decision, review: Decision | null, now = new Date()) {
  if (!c.resolvedAt || !['APROBADA', 'RECHAZADA'].includes(c.status)) return false;
  const notice = c.events.find(e => e.action === 'RESOLUCION_NOTIFICADA');
  if (!notice) return false;
  if (c.parentId) return true;
  // An initial decision with a review must never supersede its reviewing decision.
  if (review) return false;
  return now.getTime() >= notice.createdAt.getTime() + 12 * 3600000;
}
export const SCORED_STATUSES: MatchStatus[] = ['FINALIZADO', 'RESULTADO_ADMINISTRATIVO'];
export const CLOSED_MATCH_STATUSES: MatchStatus[] = [...SCORED_STATUSES, 'ANULADO_VENCIMIENTO', 'ANULADO_TECNICO'];
export function isAnnulled(status: string) { return status === 'ANULADO_VENCIMIENTO' || status === 'ANULADO_TECNICO'; }
