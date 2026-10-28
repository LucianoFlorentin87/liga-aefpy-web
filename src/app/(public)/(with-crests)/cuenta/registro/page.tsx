import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFanSession } from "@/lib/fan-auth";
import { AuthCard } from "@/components/AuthScreen";
import { FanRegisterForm } from "@/components/FanRegisterForm";
export const metadata: Metadata = { title: "Crear cuenta" };

export default async function FanRegisterPage() {
  const session = await getFanSession();
  if (session) redirect("/fixture");
  return <div className="container-page py-10 sm:py-14">
    <header className="registration-hero"><p className="arena-overline">Comunidad / eFootball</p><h1>Sumate a la liga.</h1><p>Creá tu cuenta de hincha para votar quién creés que gana cada partido de la jornada.</p></header>
    <div className="max-w-md"><AuthCard>
      <p className="auth-eyebrow">Cuenta de hincha</p>
      <h2 className="auth-title">Tu lugar en la liga.</h2>
      <p className="auth-description">Completá tus datos para empezar a participar.</p>
      <FanRegisterForm />
      <p className="auth-secondary">¿Ya tenés cuenta? <Link href="/cuenta/login">Ingresá acá ↗</Link></p>
    </AuthCard></div>
  </div>;
}
