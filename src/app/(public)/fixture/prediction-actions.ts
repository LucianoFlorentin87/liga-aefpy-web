"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getFanSession } from "@/lib/fan-auth";
import { predictionSchema } from "@/lib/validation";

export type CastPredictionResult = { error?: string; success?: boolean };

const VOTABLE_STATUSES = new Set(["PROGRAMADO", "REPROGRAMADO"]);

export async function castPredictionAction(matchId: string, choice: string): Promise<CastPredictionResult> {
  const fan = await getFanSession();
  if (!fan) return { error: "Necesitás una cuenta para votar." };

  const parsed = predictionSchema.safeParse({ matchId, choice });
  if (!parsed.success) return { error: "Datos inválidos." };

  const match = await prisma.match.findUnique({ where: { id: parsed.data.matchId } });
  if (!match) return { error: "El partido no existe." };
  if (!VOTABLE_STATUSES.has(match.status)) {
    return { error: "Ya no se puede votar en este partido." };
  }

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: fan.sub, matchId: parsed.data.matchId } },
    update: { choice: parsed.data.choice },
    create: { userId: fan.sub, matchId: parsed.data.matchId, choice: parsed.data.choice },
  });

  revalidatePath("/fixture");
  return { success: true };
}
