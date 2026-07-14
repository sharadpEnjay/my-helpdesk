import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { BackButton } from "../components/BackButton";
import { TicketDetail } from "../components/TicketDetail";
import { ReplyThread } from "../components/ReplyThread";
import { UpdateTicket } from "../components/UpdateTicket";
import { Skeleton } from "@/components/ui/skeleton";
import { type Ticket } from "core/schemas/ticket";

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => axios.get<Ticket>(`/api/tickets/${id}`).then((res) => res.data),
  });

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-8">
      <BackButton to="/tickets" label="Back to queue" />

      {isPending && <DetailSkeleton />}

      {error && (
        <div className="rounded-lg border border-sla-breach/25 bg-sla-breach/10 p-4 text-sm text-sla-breach">
          {error.message}
        </div>
      )}

      {ticket && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <TicketDetail ticket={ticket} />

            <ReplyThread ticket={ticket} />

            <div className="font-mono text-xs text-muted-foreground">
              Last updated {new Date(ticket.updatedAt).toLocaleString()}
            </div>
          </div>

          <UpdateTicket ticket={ticket} />
        </div>
      )}
    </main>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-96 max-w-full" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  );
}
