"use client";

import { useState } from "react";
import { PlayerCardThumb } from "@/components/PlayerCardThumb";
import type { EfhubCardInput } from "@/app/admin/(protected)/jugadores/actions";

type SelectedCard = {
  name: string;
  cardImageUrl: string | null;
  overall: number | null;
  position: string | null;
};

/**
 * Buscador de cartas de eFootball en eFHUB. No sabe si el jugador ya existe
 * o se está por crear: al elegir una carta llama a onPick, que decide qué
 * hacer con ella (guardarla ya mismo en el jugador editado, o sólo dejarla
 * lista para enviarla junto con el alta de un jugador nuevo). Si onPick
 * devuelve un mensaje, se muestra como error y la carta no se marca como
 * elegida.
 */
export function EfhubCardPicker({
  selected,
  onPick,
  onClear,
}: {
  selected: SelectedCard | null;
  onPick: (card: EfhubCardInput) => Promise<string | void> | string | void;
  onClear: () => Promise<void> | void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EfhubCardInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (query.trim().length < 2) {
      setError("Escribí al menos 2 letras.");
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(`/admin/jugadores/efhub-search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        const base = data.error || "No se pudo consultar eFHUB.";
        throw new Error(data.details ? `${base} (${data.details})` : base);
      }
      setResults(data.cards ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo consultar eFHUB.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handlePick(card: EfhubCardInput) {
    setBusy(true);
    setError(null);
    try {
      const errorMessage = await onPick(card);
      if (errorMessage) {
        setError(errorMessage);
        return;
      }
      setResults([]);
      setQuery("");
      setSearched(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    setBusy(true);
    try {
      await onClear();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sm:col-span-2">
      <label className="field-label">Carta de eFootball (eFHUB, opcional)</label>

      {selected && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-2">
          <PlayerCardThumb name={selected.name} cardImageUrl={selected.cardImageUrl} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--color-navy-900)]">{selected.name}</p>
            <p className="text-xs text-[var(--color-gray-500)]">
              {[selected.overall ? `${selected.overall} OVR` : null, selected.position].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button type="button" onClick={handleClear} disabled={busy} className="btn btn-ghost !px-2 !py-1 text-xs">
            Quitar
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Buscar por nombre en eFHUB…"
          className="input"
        />
        <button type="button" onClick={handleSearch} disabled={loading} className="btn btn-outline shrink-0">
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {error && <p className="field-error mt-1">{error}</p>}

      {searched && !loading && !error && results.length === 0 && (
        <p className="mt-1 text-xs text-[var(--color-gray-500)]">Sin resultados en eFHUB para esa búsqueda.</p>
      )}

      {results.length > 0 && (
        <ul className="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg border border-[var(--color-gray-200)] p-1">
          {results.map((card) => (
            <li key={card.efhubId}>
              <button
                type="button"
                onClick={() => handlePick(card)}
                disabled={busy}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[var(--color-gray-50)]"
              >
                <PlayerCardThumb name={card.name} cardImageUrl={card.cardImageUrl} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--color-navy-900)]">{card.name}</span>
                  <span className="block text-xs text-[var(--color-gray-500)]">
                    {[card.overall ? `${card.overall} OVR` : null, card.position].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
