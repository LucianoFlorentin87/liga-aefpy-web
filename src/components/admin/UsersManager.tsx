"use client";

import { useActionState, useEffect, useState } from "react";
import type { RoleKey, UserStatus } from "@prisma/client";
import { roleLabel } from "@/lib/format";
import { ActiveStatusBadge } from "@/components/StatusBadge";
import {
  createUserAction,
  updateUserAction,
  toggleUserStatusAction,
  deleteUserAction,
  resetPasswordAction,
  type FormState,
} from "@/app/admin/(protected)/usuarios/actions";

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  status: UserStatus;
  role: { key: RoleKey };
  lastLoginAt: Date | null;
};

const ROLES: RoleKey[] = ["SUPERADMIN", "ADMINISTRADOR", "CARGA_DATOS"];
const emptyState: FormState = {};

function UserForm({
  mode,
  user,
  onDone,
}: {
  mode: "create" | "edit";
  user?: UserRow;
  onDone: () => void;
}) {
  const action = mode === "create" ? createUserAction : updateUserAction;
  const [state, formAction, pending] = useActionState(action, emptyState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {mode === "edit" && <input type="hidden" name="id" value={user!.id} />}
      <div>
        <label className="field-label">Nombre</label>
        <input name="firstName" required defaultValue={user?.firstName} className="input" />
      </div>
      <div>
        <label className="field-label">Apellido</label>
        <input name="lastName" required defaultValue={user?.lastName} className="input" />
      </div>
      <div>
        <label className="field-label">Correo</label>
        <input name="email" type="email" required defaultValue={user?.email} className="input" />
      </div>
      <div>
        <label className="field-label">Usuario</label>
        <input name="username" required defaultValue={user?.username} className="input" />
      </div>
      {mode === "create" && (
        <div>
          <label className="field-label">Contraseña temporal</label>
          <input name="password" type="password" required minLength={8} className="input" />
        </div>
      )}
      <div>
        <label className="field-label">Rol</label>
        <select name="role" required defaultValue={user?.role.key ?? "CARGA_DATOS"} className="input">
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Estado</label>
        <select name="status" required defaultValue={user?.status ?? "ACTIVO"} className="input">
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      {state.error && <p className="field-error sm:col-span-2">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Guardando…" : mode === "create" ? "Crear usuario" : "Guardar cambios"}
        </button>
        <button type="button" onClick={onDone} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ResetPasswordForm({ user, onDone }: { user: UserRow; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, emptyState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={user.id} />
      <div>
        <label className="field-label">Nueva contraseña temporal para {user.username}</label>
        <input name="password" type="password" required minLength={8} className="input" />
      </div>
      {state.error && <p className="field-error">{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Guardando…" : "Restablecer"}
        </button>
        <button type="button" onClick={onDone} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function UsersManager({ users, actorId }: { users: UserRow[]; actorId: string }) {
  const [panel, setPanel] = useState<{ mode: "create" | "edit" | "reset"; user?: UserRow } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-[var(--color-navy-900)]">Usuarios</h1>
        <button className="btn btn-primary" onClick={() => setPanel({ mode: "create" })}>
          + Nuevo usuario
        </button>
      </div>

      {panel && (
        <div className="card p-5">
          <h2 className="section-title mb-4">
            {panel.mode === "create" && "Crear usuario"}
            {panel.mode === "edit" && "Editar usuario"}
            {panel.mode === "reset" && "Restablecer contraseña"}
          </h2>
          {panel.mode === "reset" ? (
            <ResetPasswordForm user={panel.user!} onDone={() => setPanel(null)} />
          ) : (
            <UserForm mode={panel.mode} user={panel.user} onDone={() => setPanel(null)} />
          )}
        </div>
      )}

      <div className="card p-3 sm:p-5">
        {users.length === 0 ? (
          <p className="empty-state">
            <strong>Sin datos registrados</strong>
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-semibold text-[var(--color-navy-900)]">
                      {u.firstName} {u.lastName}
                      {u.id === actorId && <span className="ml-1.5 text-xs text-[var(--color-gray-400)]">(vos)</span>}
                    </td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{roleLabel(u.role.key)}</td>
                    <td>
                      <ActiveStatusBadge status={u.status} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => setPanel({ mode: "edit", user: u })}>
                          Editar
                        </button>
                        <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => setPanel({ mode: "reset", user: u })}>
                          Restablecer clave
                        </button>
                        <form action={toggleUserStatusAction}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className="btn btn-ghost !px-2 !py-1 text-xs" disabled={u.id === actorId}>
                            {u.status === "ACTIVO" ? "Desactivar" : "Activar"}
                          </button>
                        </form>
                        <form
                          action={deleteUserAction}
                          onSubmit={(e) => {
                            if (!confirm(`¿Eliminar al usuario ${u.username}? Esta acción no se puede deshacer.`)) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={u.id} />
                          <button className="btn btn-danger !px-2 !py-1 text-xs" disabled={u.id === actorId}>
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
