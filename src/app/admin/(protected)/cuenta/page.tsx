import type { Metadata } from "next";
import { requireAuth } from "@/lib/permissions";
import { roleLabel } from "@/lib/format";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function CuentaPage() {
  const { session, user } = await requireAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Mi cuenta</h1>
        <p className="text-sm text-[var(--color-gray-500)]">Datos de tu sesión y cambio de contraseña.</p>
      </div>

      <div className="card max-w-sm p-5">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--color-gray-500)]">Nombre</dt>
            <dd className="font-semibold text-[var(--color-navy-900)]">
              {session.firstName} {session.lastName}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-gray-500)]">Usuario</dt>
            <dd className="font-semibold text-[var(--color-navy-900)]">{session.username}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-gray-500)]">Rol</dt>
            <dd className="font-semibold text-[var(--color-navy-900)]">{roleLabel(session.role)}</dd>
          </div>
        </dl>
      </div>

      {user.mustChangePassword && (
        <p className="max-w-sm rounded-lg bg-[#fdf1d6] px-3 py-2 text-sm font-medium text-[#8a5a05]">
          Tenés una contraseña temporal. Te recomendamos cambiarla ahora.
        </p>
      )}

      <div className="card max-w-sm p-5">
        <h2 className="section-title mb-4">Cambiar contraseña</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
