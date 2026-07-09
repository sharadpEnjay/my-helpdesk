import { type Ticket } from "core/schemas/ticket";

interface TicketDetailProps {
  ticket: Ticket;
}

export function TicketDetail({ ticket }: TicketDetailProps) {
  return (
    <>
      <div>
        <h1 className="text-3xl font-bold mb-2">{ticket.subject}</h1>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span>#{ticket.id}</span>
          <span>&middot;</span>
          <span>{new Date(ticket.createdAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-xs text-slate-500 mb-1">From</div>
        <div className="text-sm text-white">{ticket.senderName}</div>
        <div className="text-xs text-slate-400 mt-0.5">{ticket.senderEmail}</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
        <h2 className="text-sm font-medium text-slate-400 mb-3">Message</h2>
        {ticket.bodyHtml ? (
          <div
            className="prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: ticket.bodyHtml }}
          />
        ) : (
          <p className="text-slate-200 whitespace-pre-wrap">{ticket.body}</p>
        )}
      </div>
    </>
  );
}
