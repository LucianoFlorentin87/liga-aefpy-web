"use server";

import { redirect } from "next/navigation";
import { destroySession, requireActiveUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function logoutAction() {
  const result = await requireActiveUser();
  if (result) {
    await logActivity(`${result.user.firstName} ${result.user.lastName} cerró sesión.`, result.user.id);
  }
  await destroySession();
  redirect("/admin/login");
}
