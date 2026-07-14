import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketStatus, TicketCategory } from "core/constants/ticket";
import { type Ticket } from "core/schemas/ticket";
import { statusStyles } from "@/lib/ticket-styles";

interface Agent {
  id: string;
  name: string;
  email: string;
}

interface UpdateTicketProps {
  ticket: Ticket;
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

export function UpdateTicket({ ticket }: UpdateTicketProps) {
  const queryClient = useQueryClient();
  const ticketId = String(ticket.id);

  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: () => axios.get<Agent[]>("/api/users/agents").then((res) => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      axios.patch(`/api/tickets/${ticketId}`, patch).then((res) => res.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["ticket", ticketId], updated);
    },
  });

  return (
    <div className="space-y-4 lg:sticky lg:top-8 lg:self-start">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
        Manage
      </p>
      <FieldSelect
        label="Status"
        value={ticket.status}
        onValueChange={(v) => updateMutation.mutate({ status: v })}
        disabled={updateMutation.isPending}
        triggerClassName={statusStyles[ticket.status]}
      >
        {Object.values(TicketStatus)
          .filter((s) => s !== "new" && s !== "processing")
          .map((s) => (
            <SelectItem key={s} value={s}>
              <span className="capitalize">{s}</span>
            </SelectItem>
          ))}
      </FieldSelect>
      <FieldSelect
        label="Category"
        value={ticket.category ?? NO_CATEGORY}
        onValueChange={(v) => updateMutation.mutate({ category: v === NO_CATEGORY ? null : v })}
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
        onValueChange={(v) => updateMutation.mutate({ assignedToId: v === UNASSIGNED ? null : v })}
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
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          aria-label={label}
          className={`w-full ${triggerClassName ?? ""}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}
