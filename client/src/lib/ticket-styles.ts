import type { TicketStatus } from "core/constants/ticket";

export const statusStyles: Record<TicketStatus, string> = {
  new: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  processing: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  open: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  resolved: "bg-green-500/15 text-green-400 border-green-500/20",
  closed: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};
