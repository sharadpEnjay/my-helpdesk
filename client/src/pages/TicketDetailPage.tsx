import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Navbar } from "../components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import type { TicketStatus, TicketCategory } from "core/constants/ticket";
import { statusStyles } from "@/lib/ticket-styles";

interface TicketDetail {
  id: number;
  subject: string;
  body: string;
  bodyHtml: string | null;
  status: TicketStatus;
  category: TicketCategory | null;
  senderName: string;
  senderEmail: string;
  assignedTo: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketDetailPageProps {
  userName: string;
  role?: string;
}

export function TicketDetailPage({ userName, role }: TicketDetailPageProps) {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => axios.get<TicketDetail>(`/api/tickets/${id}`).then((res) => res.data),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white/87">
      <Navbar userName={userName} role={role} />
      <div className="px-8 pb-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white -ml-2 mb-4">
            <Link to="/tickets">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to tickets
            </Link>
          </Button>

          {isPending && <DetailSkeleton />}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              {error.message}
            </div>
          )}

          {ticket && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{ticket.subject}</h1>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span>#{ticket.id}</span>
                    <span>&middot;</span>
                    <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={statusStyles[ticket.status]}>{ticket.status}</Badge>
                  {ticket.category && (
                    <Badge variant="outline" className="border-white/10 text-slate-300">
                      {ticket.category.replace("_", " ")}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="From" value={ticket.senderName} sub={ticket.senderEmail} />
                <InfoCard
                  label="Assigned to"
                  value={ticket.assignedTo?.name ?? "Unassigned"}
                  sub={ticket.assignedTo?.email}
                />
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

              <div className="text-xs text-slate-500">
                Last updated {new Date(ticket.updatedAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm text-white">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-96 bg-white/10 mb-2" />
        <Skeleton className="h-4 w-48 bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 bg-white/10 rounded-xl" />
        <Skeleton className="h-20 bg-white/10 rounded-xl" />
      </div>
      <Skeleton className="h-48 bg-white/10 rounded-2xl" />
    </div>
  );
}
