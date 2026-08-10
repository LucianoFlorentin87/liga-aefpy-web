import { matchStatusLabel, statusLabel, sanctionStatusLabel } from "@/lib/format";

const MATCH_STYLES: Record<string, string> = {
  PROGRAMADO: "badge-navy",
  EN_CURSO: "badge-amber",
  FINALIZADO: "badge-green",
  SUSPENDIDO: "badge-red",
  REPROGRAMADO: "badge-gray",
};

export function MatchStatusBadge({ status }: { status: string }) {
  return <span className={`badge ${MATCH_STYLES[status] ?? "badge-gray"}`}>{matchStatusLabel(status)}</span>;
}

export function ActiveStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${status === "ACTIVO" ? "badge-green" : "badge-gray"}`}>
      {statusLabel(status)}
    </span>
  );
}

export function SanctionStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${status === "ACTIVA" ? "badge-red" : "badge-green"}`}>
      {sanctionStatusLabel(status)}
    </span>
  );
}
