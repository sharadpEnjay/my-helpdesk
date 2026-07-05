import { useParams, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Navbar } from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import {
  TicketStatus,
  TicketCategory,
  type TicketStatus as TicketStatusType,
  type TicketCategory as TicketCategoryType,
} from "core/constants/ticket";
import { statusStyles } from "@/lib/ticket-styles";

interface TicketDetail {
  id: number;
  subject: string;
  body: string;
  bodyHtml: string | null;
  status: TicketStatusType;
  category: TicketCategoryType | null;
  senderName: string;
  senderEmail: string;
  assignedTo: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
}

interface TicketDetailPageProps {
  userName: string;
  role?: string;
}

const UNASSIGNED = "__unassigned__";
const NO_CATEGORY = "__none__";

const categoryLabels: Record<string, string> = {
  general: "General",
  billing: "Billing",
  technical: "Technical",
  bug: "Bug",
  feature_request: "Feature Request",
};

export function TicketDetailPage({ userName, role }: TicketDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => axios.get<TicketDetail>(`/api/tickets/${id}`).then((res) => res.data),
  });

  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: () => axios.get<Agent[]>("/api/users/agents").then((res) => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      axios.patch<TicketDetail>(`/api/tickets/${id}`, patch).then((res) => res.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["ticket", id], updated);
    },
  });

  const handleAssign = (value: string) => {
    updateMutation.mutate({ assignedToId: value === UNASSIGNED ? null : value });
  };

  const handleStatusChange = (value: string) => {
    updateMutation.mutate({ status: value });
  };

  const handleCategoryChange = (value: string) => {
    updateMutation.mutate({ category: value === NO_CATEGORY ? null : value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white/87">
      <Navbar userName={userName} role={role} />
      <div className="px-8 pb-8 max-w-6xl mx-auto">
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
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{ticket.subject}</h1>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span>#{ticket.id}</span>
                    <span>&middot;</span>
                    <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <InfoCard label="From" value={ticket.senderName} sub={ticket.senderEmail} />

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

              <div className="space-y-4">
                <FieldSelect
                  label="Status"
                  value={ticket.status}
                  onValueChange={handleStatusChange}
                  disabled={updateMutation.isPending}
                  triggerClassName={statusStyles[ticket.status]}
                >
                  {Object.values(TicketStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="capitalize">{s}</span>
                    </SelectItem>
                  ))}
                </FieldSelect>
                <FieldSelect
                  label="Category"
                  value={ticket.category ?? NO_CATEGORY}
                  onValueChange={handleCategoryChange}
                  disabled={updateMutation.isPending}
                >
                  <SelectItem value={NO_CATEGORY}>None</SelectItem>
                  {Object.values(TicketCategory).map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabels[c]}
                    </SelectItem>
                  ))}
                </FieldSelect>
                <FieldSelect
                  label="Assigned to"
                  value={ticket.assignedTo?.id ?? UNASSIGNED}
                  onValueChange={handleAssign}
                  disabled={updateMutation.isPending}
                >
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </FieldSelect>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onValueChange,
  disabled,
  triggerClassName,
  children,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  triggerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-slate-500 mb-2">{label}</div>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={`w-full bg-white/[0.05] border-white/10 text-white ${triggerClassName ?? ""}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
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
