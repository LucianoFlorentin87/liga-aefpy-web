import { requireAuth } from "@/lib/permissions";
import { can } from "@/lib/permissions";
import { ADMIN_NAV, DELEGADO_NAV } from "@/lib/admin-nav";
import { roleLabel } from "@/lib/format";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const [{ session }, settings] = await Promise.all([
    requireAuth(),
    prisma.tournamentSettings.findUnique({ where: { id: "settings" } }),
  ]);

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
      orgName={settings?.orgName ?? "Liga AEFPY"}
      orgTagline={settings?.orgTagline ?? "Asociación de Efootball Paraguay"}
    >
      {children}
    </AdminShell>
  );
}
