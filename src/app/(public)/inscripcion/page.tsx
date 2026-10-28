import { redirect } from "next/navigation";
import { getCurrentSeason } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function RegistrationRoot() {
  const season = await getCurrentSeason();
  redirect("/inscripcion/" + season.slug);
}
