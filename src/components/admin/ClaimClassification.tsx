'use client';
import { useState } from 'react';
import { CLAIM_NATURES, type ClaimNature } from '@/lib/regulation-policy';
export function ClaimClassification({className}:{className:string}) {
 const [nature,setNature]=useState<ClaimNature|''>('');
 const articles=nature?CLAIM_NATURES[nature].articles:[];
 return <><label className="block">Naturaleza del reclamo<select name="nature" required className={className} value={nature} onChange={e=>setNature(e.target.value as ClaimNature)}><option value="">Seleccionar motivo</option>{Object.entries(CLAIM_NATURES).map(([key,item])=><option key={key} value={key}>{item.label}</option>)}</select></label><label className="block">Artículo relacionado<select name="article" key={nature} required className={className} disabled={!nature}><option value="">Seleccionar artículo</option>{articles.map(a=><option key={a} value={a}>Artículo {a}</option>)}</select></label><p className="text-sm">La clasificación orienta al Comité. No acredita una infracción ni concede puntos; explicá los hechos y adjuntá tus pruebas en la presentación.</p></>;
}
