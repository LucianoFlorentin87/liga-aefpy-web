import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";

export default async function AdminIndexPage() {
  // requireActiveUser, no getSession crudo — ver el mismo comentario en
  // admin/login/page.tsx.
  const result = await requireActiveUser();
  if (!result) redirect("/admin/login");
  redirect(result.session.role === "DELEGADO" ? "/admin/mi-equipo" : "/admin/dashboard");
}
