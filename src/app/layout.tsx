import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Liga AEFPY",
    template: "%s · Liga AEFPY",
  },
  description:
    "Liga AEFPY — Asociación de Efootball Paraguay. Fixture, resultados, posiciones, goleadores y disciplina del torneo.",
};

// Aplica el tema guardado ANTES de que React hidrate, para que la página
// no "parpadee" en claro un instante y después salte a oscuro. Vive acá
// (no en un componente) porque tiene que correr sincrónicamente en el
// <head>, antes del primer paint — ver ThemeToggle.tsx para el botón que
// lo cambia y lo guarda.
const themeInitScript = `
try {
  var stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    document.documentElement.setAttribute("data-theme", stored);
  }
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      // El script de abajo le agrega data-theme al <html> antes de que
      // React hidrate (necesario para que no haya parpadeo de tema) — eso
      // hace que el DOM real no coincida con lo que React renderizó acá,
      // que nunca pone data-theme por sí solo. Es la discrepancia esperada
      // en este patrón (el mismo que usa next-themes), no un bug real.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
