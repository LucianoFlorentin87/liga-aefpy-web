"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { castPredictionAction } from "@/app/(public)/fixture/prediction-actions";

export type PredictionChoice = "LOCAL" | "EMPATE" | "VISITANTE";

export type PredictionTally = {
  counts: Record<PredictionChoice, number>;
  ownChoice: PredictionChoice | null;
};

const CHOICES: { value: PredictionChoice; label: string }[] = [
  { value: "LOCAL", label: "Gana local" },
  { value: "EMPATE", label: "Empate" },
  { value: "VISITANTE", label: "Gana visitante" },
];

export function PredictionWidget({
  matchId,
  canVote,
  tally,
}: {
  matchId: string;
  canVote: boolean;
  tally: PredictionTally;
}) {
  const [pending, startTransition] = useTransition();
  const [ownChoice, setOwnChoice] = useState(tally.ownChoice);
  const [counts, setCounts] = useState(tally.counts);
  const [error, setError] = useState<string | null>(null);

  const total = counts.LOCAL + counts.EMPATE + counts.VISITANTE;

  function vote(choice: PredictionChoice) {
    if (pending || choice === ownChoice) return;
    setError(null);
    const previous = ownChoice;
    setCounts((prev) => {
      const next = { ...prev };
      if (previous) next[previous] -= 1;
      next[choice] += 1;
      return next;
    });
    setOwnChoice(choice);
    startTransition(async () => {
      const result = await castPredictionAction(matchId, choice);
      if (result.error) {
        setError(result.error);
        setOwnChoice(previous);
        setCounts(tally.counts);
      }
    });
  }

  if (!canVote) {
    return (
      <div className="mt-2 rounded-lg bg-[var(--color-gray-50)] px-3 py-2 text-xs text-[var(--color-gray-500)]">
        <Link href="/cuenta/login" className="font-semibold text-[var(--color-red-600)] hover:underline">
          Ingresá
        </Link>{" "}
        o{" "}
        <Link href="/cuenta/registro" className="font-semibold text-[var(--color-red-600)] hover:underline">
          creá tu cuenta
        </Link>{" "}
        para votar quién creés que gana.
      </div>
    );
  }

  // El % de cada opción se revela recién después de votar — antes sólo se
  // ven los botones para elegir, para no arruinar el "morbo" de comparar tu
  // elección contra la del resto apenas entrás.
  const revealPercentages = ownChoice !== null;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {CHOICES.map(({ value, label }) => {
          const pct = total > 0 ? Math.round((counts[value] / total) * 100) : 0;
          const selected = ownChoice === value;
          return (
            <button
              key={value}
              type="button"
              disabled={pending}
              onClick={() => vote(value)}
              className={`rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold transition ${
                selected
                  ? "border-[var(--color-red-600)] bg-[var(--color-red-600)] text-white"
                  : "border-[var(--color-gray-200)] text-[var(--color-gray-600)] hover:border-[var(--color-red-300)]"
              }`}
            >
              {label}
              {revealPercentages ? ` · ${pct}%` : ""}
            </button>
          );
        })}
      </div>
      {error && <p className="text-[0.7rem] font-medium text-[var(--color-red-600)]">{error}</p>}
      {revealPercentages ? (
        <p className="text-[0.68rem] text-[var(--color-gray-400)]">
          {total} {total === 1 ? "voto" : "votos"} · la predicción no afecta el resultado oficial
        </p>
      ) : (
        <p className="text-[0.68rem] text-[var(--color-gray-400)]">Votá para ver qué eligió el resto.</p>
      )}
    </div>
  );
}
