import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFanSession } from "@/lib/fan-auth";
import { FanLoginForm } from "@/components/FanLoginForm";

export const metadata: Metadata = { title: "Ingresar" };

export default async function FanLoginPage() {
  const session = await getFanSession();
  if (session) redirect("/fixture");

  return (
    <div>
      <div className="border-b border-[var(--color-gray-200)] bg-white">
        <div className="container-page py-6">
          <h1 className="text-xl font-extrabold text-[var(--color-navy-900)] sm:text-2xl">Ingresar</h1>
          <p className="mt-1 text-sm text-[var(--color-gray-500)]">Entrá a tu cuenta para votar en cada jornada.</p>
        </div>
      </div>
      <div className="container-page flex justify-center py-10">
        <div className="w-full max-w-sm card p-6">
          <FanLoginForm />
          <p className="mt-4 text-center text-xs text-[var(--color-gray-500)]">
            ¿Todavía no tenés cuenta?{" "}
            <Link href="/cuenta/registro" className="font-semibold text-[var(--color-red-600)] hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
