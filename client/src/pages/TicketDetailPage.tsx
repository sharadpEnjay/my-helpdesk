import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Navbar } from "../components/Navbar";
import { BackButton } from "../components/BackButton";
import { TicketDetail } from "../components/TicketDetail";
import { ReplyThread } from "../components/ReplyThread";
import { UpdateTicket } from "../components/UpdateTicket";
import { Skeleton } from "@/components/ui/skeleton";
import { type Ticket } from "core/schemas/ticket";

interface TicketDetailPageProps {
  userName: string;
  role?: string;
}

export function TicketDetailPage({ userName, role }: TicketDetailPageProps) {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => axios.get<Ticket>(`/api/tickets/${id}`).then((res) => res.data),
  });

  return (
    <div className="min-h-screen text-foreground">
      <Navbar userName={userName} role={role} />
      <div className="px-8 pb-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <BackButton to="/tickets" label="Back to tickets" />

          {isPending && <DetailSkeleton />}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              {error.message}
            </div>
          )}

          {ticket && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <TicketDetail ticket={ticket} />

                <ReplyThread ticket={ticket} />

                <div className="text-xs text-slate-500">
                  Last updated {new Date(ticket.updatedAt).toLocaleString()}
                </div>
              </div>

              <UpdateTicket ticket={ticket} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <div>
          <Skeleton className="h-9 w-96 bg-white/10 mb-2" />
          <Skeleton className="h-4 w-48 bg-white/10" />
        </div>
        <Skeleton className="h-20 bg-white/10 rounded-xl" />
        <Skeleton className="h-48 bg-white/10 rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-20 bg-white/10 rounded-xl" />
        <Skeleton className="h-20 bg-white/10 rounded-xl" />
        <Skeleton className="h-20 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}
