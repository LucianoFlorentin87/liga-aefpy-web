"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getVoterIdentity } from "@/lib/voter";
import { predictionSchema } from "@/lib/validation";

export type CastPredictionResult = { error?: string; success?: boolean };

const VOTABLE_STATUSES = new Set(["PROGRAMADO", "REPROGRAMADO"]);

export async function castPredictionAction(matchId: string, choice: string): Promise<CastPredictionResult> {
  const voter = await getVoterIdentity();
  if (!voter) return { error: "Necesitás una cuenta para votar." };

  const parsed = predictionSchema.safeParse({ matchId, choice });
  if (!parsed.success) return { error: "Datos inválidos." };

  const match = await prisma.match.findUnique({ where: { id: parsed.data.matchId } });
  if (!match) return { error: "El partido no existe." };
  if (!VOTABLE_STATUSES.has(match.status)) {
    return { error: "Ya no se puede votar en este partido." };
  }

  if (voter.kind === "fan") {
    await prisma.prediction.upsert({
      where: { fanUserId_matchId: { fanUserId: voter.id, matchId: parsed.data.matchId } },
      update: { choice: parsed.data.choice },
      create: { fanUserId: voter.id, matchId: parsed.data.matchId, choice: parsed.data.choice },
    });
  } else {
    await prisma.prediction.upsert({
      where: { staffUserId_matchId: { staffUserId: voter.id, matchId: parsed.data.matchId } },
      update: { choice: parsed.data.choice },
      create: { staffUserId: voter.id, matchId: parsed.data.matchId, choice: parsed.data.choice },
    });
  }

  revalidatePath("/fixture");
  return { success: true };
}
