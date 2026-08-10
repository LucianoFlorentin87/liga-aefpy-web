import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Torneo Exa Frutos",
    template: "%s · Torneo Exa Frutos",
  },
  description:
    "Torneo de Fútbol de Exalumnos del Colegio Nacional Juan Manuel Frutos — organizado por la Asociación de Exalumnos Exa Frutos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
