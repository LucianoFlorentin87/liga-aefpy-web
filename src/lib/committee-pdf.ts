import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
export type ResolutionDocument = { number:string; caseId:string; title:string; resolution:string; resolvedAt:Date; notificationAt:Date|null; parentId:string|null; applicant:string; respondent:string; organization:string; reviewStatus?:string };
export async function renderResolutionPdf(data:ResolutionDocument, logo:Uint8Array) {
 const pdf=await PDFDocument.create();
 pdf.setTitle('Resolución '+data.number);pdf.setAuthor(data.organization);pdf.setCreationDate(data.resolvedAt);
 const font=await pdf.embedFont(StandardFonts.Helvetica), bold=await pdf.embedFont(StandardFonts.HelveticaBold), emblem=await pdf.embedPng(logo);
 let page=pdf.addPage([595.28,841.89]), y=0, index=0;
 const clean=(s:string)=>s.replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/[^\u0020-\u007e\u00a0-\u00ff\n]/g,'?');
 function start() {
  index++;const logoScale=Math.min(46/emblem.width,54/emblem.height);page.drawImage(emblem,{x:44,y:748,width:emblem.width*logoScale,height:emblem.height*logoScale});
  const org=clean(data.organization).replace(/\s+/g,' ');
  page.drawText(org,{x:103,y:783,size:Math.min(15,445/Math.max(1,bold.widthOfTextAtSize(org,1))),font:bold,color:rgb(.08,.18,.28)});
  page.drawText('Comité organizador | Resolución deportiva',{x:103,y:766,size:10,font});
  page.drawLine({start:{x:44,y:733},end:{x:551,y:733},thickness:1,color:rgb(.7,.54,.21)});
  page.drawText(`Liga AEFPY | Expediente ${clean(data.caseId)} | Página ${index}`,{x:44,y:30,size:8,font});y=710;
 }
 function line(t:string,size=10,heading=false) {
  if(y<65){page=pdf.addPage([595.28,841.89]);start();}
  page.drawText(t,{x:44,y,size,font:heading?bold:font,color:rgb(.12,.16,.22)});y-=size+5;
 }
 function paragraph(text:string,size=10,heading=false) {
  const face=heading?bold:font;
  for(const raw of clean(text).split('\n')) {
   let acc='';
   // Split long identifiers too, so user text cannot run outside the page.
   const words=raw.split(/\s+/).flatMap(word=>{
    const chunks:string[]=[];let chunk='';
    for(const ch of word){if(chunk && face.widthOfTextAtSize(chunk+ch,size)>505){chunks.push(chunk);chunk='';}chunk+=ch;}
    if(chunk)chunks.push(chunk);return chunks;
   });
   for(const word of words){ const next=acc?acc+' '+word:word;if(face.widthOfTextAtSize(next,size)>505&&acc){line(acc,size,heading);acc=word;}else acc=next; }
   line(acc,size,heading);
  } y-=6;
 }
 const date=(d:Date)=>new Intl.DateTimeFormat('es-PY',{timeZone:'America/Asuncion',dateStyle:'short',timeStyle:'short'}).format(d);
 start();paragraph('RESOLUCIÓN '+data.number,16,true);paragraph(`Expediente: ${data.caseId}\nFecha: ${date(data.resolvedAt)} (Paraguay)`);
 paragraph(data.title,12,true);paragraph(`${data.applicant} / ${data.respondent}`);
 if(data.parentId)paragraph('Revisión del expediente '+data.parentId);
 if(data.reviewStatus)paragraph(data.reviewStatus,10,true);
 paragraph('Fundamentos, decisión y efectos',12,true);paragraph(data.resolution);
 paragraph('Notificación y revisión',12,true);
 paragraph(data.notificationAt?`Notificación registrada: ${date(data.notificationAt)}. ${data.parentId?'Esta resolución cierra la revisión ordinaria.':'Plazo para solicitar revisión: doce horas desde la notificación. Vencimiento: '+date(new Date(data.notificationAt.getTime()+12*3600000))+'.'}`:'Pendiente de notificación comprobable a las partes. La emisión del PDF no inicia por sí sola el plazo de revisión.');
 paragraph('Constancia colegiada',12,true);paragraph('Resolución adoptada por un panel de tres miembros habilitados conforme al reglamento. Los votos y fundamentos individuales permanecen en el expediente interno. Este documento no incorpora firmas manuscritas ni digitales.');
 return pdf.save();
}
