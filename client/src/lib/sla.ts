import { TicketStatus, type TicketStatus as TStatus } from "core/constants/ticket";

export type SlaLevel = "fresh" | "soon" | "breach" | "calm";

export interface SlaSignal {
  level: SlaLevel;
  /** Short mono-friendly duration, e.g. "2h 14m", "8m", "3d". */
  label: string;
  /** CSS custom-property color for the spectrum. */
  color: string;
  /** Tailwind text color class for the spectrum. */
  textClass: string;
  /** True for open tickets that have waited too long — draws the eye. */
  pulse: boolean;
  ageMs: number;
}

const HOUR = 60 * 60 * 1000;

const RESTING: readonly TStatus[] = [TicketStatus.resolved, TicketStatus.closed];

const LEVEL_META: Record<SlaLevel, { color: string; textClass: string }> = {
  fresh: { color: "var(--sla-fresh)", textClass: "text-sla-fresh" },
  soon: { color: "var(--sla-soon)", textClass: "text-sla-soon" },
  breach: { color: "var(--sla-breach)", textClass: "text-sla-breach" },
  calm: { color: "var(--sla-calm)", textClass: "text-sla-calm" },
};

/** Compact, monospaced age like "3d", "2h 14m", "8m", "now". */
export function formatAge(ms: number): string {
  if (ms < 60 * 1000) return "now";
  const totalMinutes = Math.floor(ms / (60 * 1000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Ticket-age pressure signal. Resting tickets (resolved/closed) are calm.
 * Waiting tickets escalate along the SLA spectrum by time since last activity:
 * under 1h fresh, under 4h due-soon, beyond 4h breached.
 */
export function getSlaSignal(
  status: TStatus,
  updatedAt: string,
  now: number = Date.now(),
): SlaSignal {
  const ageMs = Math.max(0, now - new Date(updatedAt).getTime());
  const label = formatAge(ageMs);

  if (RESTING.includes(status)) {
    return { level: "calm", label, ...LEVEL_META.calm, pulse: false, ageMs };
  }

  let level: SlaLevel;
  if (ageMs < HOUR) level = "fresh";
  else if (ageMs < 4 * HOUR) level = "soon";
  else level = "breach";

  return { level, label, ...LEVEL_META[level], pulse: level === "breach", ageMs };
}
