import "server-only";
import { prisma } from "@/lib/db";

export async function logActivity(message: string, userId?: string) {
  await prisma.activityLog.create({ data: { message, userId } });
}
