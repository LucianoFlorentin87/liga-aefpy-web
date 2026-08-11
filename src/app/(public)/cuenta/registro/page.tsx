import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFanSession } from "@/lib/fan-auth";
import { FanRegisterForm } from "@/components/FanRegisterForm";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function FanRegisterPage() {
  const session = await getFanSession();
  if (session) redirect("/fixture");

  return (
    <div>
      <div className="border-b border-[var(--color-gray-200)] bg-white">
        <div className="container-page py-6">
          <h1 className="text-xl font-extrabold text-[var(--color-navy-900)] sm:text-2xl">Crear cuenta</h1>
          <p className="mt-1 text-sm text-[var(--color-gray-500)]">
            Registrate para votar quién creés que gana cada partido de la jornada.
          </p>
        </div>
      </div>
      <div className="container-page flex justify-center py-10">
        <div className="w-full max-w-sm card p-6">
          <FanRegisterForm />
          <p className="mt-4 text-center text-xs text-[var(--color-gray-500)]">
            ¿Ya tenés cuenta?{" "}
            <Link href="/cuenta/login" className="font-semibold text-[var(--color-red-600)] hover:underline">
              Ingresá acá
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
