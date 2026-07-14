import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import DOMPurify from "dompurify";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Ticket } from "core/schemas/ticket";
import { getSlaSignal } from "@/lib/sla";
import { cn } from "@/lib/utils";

interface TicketDetailProps {
  ticket: Ticket;
}

export function TicketDetail({ ticket }: TicketDetailProps) {
  const summarizeMutation = useMutation({
    mutationFn: () =>
      axios
        .post<{ summary: string }>(`/api/tickets/${ticket.id}/summarize`)
        .then((res) => res.data),
  });

  const sla = getSlaSignal(ticket.status, ticket.updatedAt);

  return (
    <>
      <div className="mt-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-muted-foreground">
            #{String(ticket.id).padStart(4, "0")}
          </span>
          <span
            className="flex items-center gap-1.5 font-mono text-xs"
            style={{ color: sla.color }}
          >
            <span
              className={cn("size-2 rounded-full", sla.pulse && "sla-pulse")}
              style={{ backgroundColor: sla.color }}
            />
            {sla.label} old
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {ticket.subject}
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Opened {new Date(ticket.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          From
        </div>
        <div className="text-sm font-medium text-foreground">
          {ticket.senderName}
        </div>
        <div className="mt-0.5 font-mono text-xs text-muted-foreground">
          {ticket.senderEmail}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-3 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          Message
        </h2>
        {ticket.bodyHtml ? (
          <div
            className="prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(ticket.bodyHtml),
            }}
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm text-foreground/90">
            {ticket.body}
          </p>
        )}
      </div>

      {summarizeMutation.data && (
        <div className="rounded-lg border border-primary/25 bg-primary/[0.06] p-6">
          <h2 className="mb-3 flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-primary">
            <Sparkles className="size-3" />
            AI Summary
          </h2>
          <p className="whitespace-pre-wrap text-sm text-foreground/90">
            {summarizeMutation.data.summary}
          </p>
        </div>
      )}

      {summarizeMutation.isError && (
        <p className="font-mono text-xs text-sla-breach">
          Failed to generate summary. Please try again.
        </p>
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={summarizeMutation.isPending}
        onClick={() => summarizeMutation.mutate()}
      >
        <Sparkles className="size-4" />
        {summarizeMutation.isPending ? "Summarizing..." : "Summarize"}
      </Button>
    </>
  );
}
