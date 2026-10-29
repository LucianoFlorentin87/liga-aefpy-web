import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { renderResolutionPdf } from '../src/lib/committee-pdf';
async function main(){
 const bytes=await renderResolutionPdf({number:'AEFPY-DEMO-001',caseId:'DEMO-001',title:'MODELO DE PRUEBA - SIN EFECTOS DEPORTIVOS',resolution:'HECHOS ACREDITADOS\nEl Equipo A presentó conversaciones completas y alternativas viables dentro del plazo. Se otorgaron 24 horas para la defensa.\n\nARTÍCULOS APLICADOS\nArtículos 4, 10 y 11 del Reglamento AEFPY v1.1.\n\nDECISIÓN\nSe concede victoria administrativa de 3-0 al Equipo A, sin goleadores individuales ni sanción personal adicional.\n\nEste ejemplo verifica el generador de la aplicación y no acredita una votación real.',resolvedAt:new Date('2026-10-29T18:00:00-03:00'),notificationAt:new Date('2026-10-29T19:00:00-03:00'),parentId:null,applicant:'Equipo A',respondent:'Equipo B',organization:'Liga AEFPY'},await readFile('public/logo-comite-aefpy.png'));
 const output = process.env.PDF_PREVIEW_PATH ?? '.next/committee-preview.pdf';
 await mkdir(path.dirname(output), { recursive: true });
 await writeFile(output,bytes);
}
main();
