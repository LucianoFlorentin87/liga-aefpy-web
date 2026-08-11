import { requireAuth } from "@/lib/permissions";
import { can } from "@/lib/permissions";
import { ADMIN_NAV, DELEGADO_NAV } from "@/lib/admin-nav";
import { roleLabel } from "@/lib/format";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { session } = await requireAuth();

  const navGroups =
    session.role === "DELEGADO"
      ? DELEGADO_NAV
      : ADMIN_NAV.map((group) => ({
          ...group,
          items: group.items.filter((item) => !item.resource || can(session.role, item.resource)),
        })).filter((group) => group.items.length > 0);

  return (
    <AdminShell
      navGroups={navGroups}
      userLabel={`${session.firstName} ${session.lastName}`}
      roleLabel={roleLabel(session.role)}
    >
      {children}
    </AdminShell>
  );
}
