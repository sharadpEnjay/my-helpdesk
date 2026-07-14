import type { TicketStatus } from "core/constants/ticket";

/** Console status chips: quiet surface, spectrum-coded text. */
export const statusStyles: Record<TicketStatus, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  processing: "bg-sla-soon/10 text-sla-soon border-sla-soon/25",
  open: "bg-[#4cc9e0]/10 text-[#4cc9e0] border-[#4cc9e0]/25",
  pending: "bg-sla-soon/10 text-sla-soon border-sla-soon/25",
  resolved: "bg-sla-fresh/10 text-sla-fresh border-sla-fresh/25",
  closed: "bg-sla-calm/10 text-sla-calm border-sla-calm/25",
};
