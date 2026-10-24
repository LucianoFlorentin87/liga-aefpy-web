import { TeamLogosBar } from "@/components/TeamLogosBar";

/**
 * Franja de escudos de equipos — en todas las páginas públicas MENOS el
 * inicio (que vive directamente en (public)/, fuera de este grupo): ahí es
 * redundante, porque el inicio ya muestra los mismos escudos en su propio
 * slider de "Equipos" más abajo en la misma página (hallazgo del audit de
 * diseño). En el resto de las páginas sí cumple una función real de
 * navegación rápida a cada equipo.
 */
export default function WithCrestsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TeamLogosBar />
      {children}
    </>
  );
}
