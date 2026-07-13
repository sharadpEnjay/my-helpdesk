export const TicketStatus = {
  new: "new",
  processing: "processing",
  open: "open",
  pending: "pending",
  resolved: "resolved",
  closed: "closed",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketCategory = {
  general: "general",
  billing: "billing",
  technical: "technical",
  bug: "bug",
  feature_request: "feature_request",
} as const;
export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory];

export const SenderType = {
  agent: "agent",
  customer: "customer",
} as const;
export type SenderType = (typeof SenderType)[keyof typeof SenderType];
