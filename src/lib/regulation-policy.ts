export const REGULATION_VERSION = '1.1';
export const REGULATION_PDF = '/documentos/Reglamento_AEFPY_v1.1.pdf';
export const REGULATION_SHA256 = '4f562d288d47d49f7031d00c21cdb3d8f8ba7b87c98c6ef75cd2408b9424b5c9';
export const ACCEPTANCE_TEXT = 'Declaro que tuve acceso al Reglamento Deportivo de Liga AEFPY, versión 1.1, y acepto sus reglas para mi participación en AEFPY Clausura 2026.';
export const CLAIM_NATURES = {
  COORDINACION: { label:'Coordinación o rival sin respuesta', articles:[4] },
  RESULTADO: { label:'Reporte o resultado del partido', articles:[5,7] },
  DESCONEXION: { label:'Lag, desconexión o continuación', articles:[6] },
  ALINEACION: { label:'Configuración, alineación o carta suspendida', articles:[3,7,8] },
  TARJETAS: { label:'Tarjetas y cumplimiento de suspensiones', articles:[8] },
  CONDUCTA: { label:'Conducta, insultos, amenazas o fraude', articles:[7,9] },
  PROCEDIMIENTO: { label:'Notificación, defensa o actuación del Comité', articles:[10,11] },
  RETIRO: { label:'Retiro o expulsión', articles:[12] },
  OTRO: { label:'Otro asunto reglamentario', articles:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
} as const;
export type ClaimNature = keyof typeof CLAIM_NATURES;
export function classifyClaim(nature: unknown, article: unknown) {
  if(typeof nature!=='string' || !Object.hasOwn(CLAIM_NATURES,nature)) throw new Error('Seleccioná la naturaleza del reclamo.');
  const selected=CLAIM_NATURES[nature as ClaimNature];
  const number=Number(article);
  if(!Number.isInteger(number) || !(selected.articles as readonly number[]).includes(number)) throw new Error('Seleccioná un artículo correspondiente a la naturaleza del reclamo.');
  return {nature:nature as ClaimNature,article:number};
}
export function validateAcknowledgement(checked:unknown,submittedId:unknown,currentId:string) {
  if(checked!=='on') throw new Error('Debés marcar personalmente la aceptación del reglamento.');
  if(submittedId!==currentId) throw new Error('El reglamento cambió. Actualizá y revisá la versión vigente.');
}
