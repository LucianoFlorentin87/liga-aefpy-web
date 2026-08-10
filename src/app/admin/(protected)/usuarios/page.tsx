import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { UsersManager } from "@/components/admin/UsersManager";

export const metadata: Metadata = { title: "Usuarios" };
export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const { user: actor } = await requirePermission("usuarios");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { role: true },
  });

  return <UsersManager users={users} actorId={actor.id} />;
}
