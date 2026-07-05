import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketStatus, TicketCategory } from "core/constants/ticket";

interface Ticket {
  id: number;
  subject: string;
  senderName: string;
  senderEmail: string;
  status: TicketStatus;
  category: TicketCategory | null;
  createdAt: string;
}

interface TicketsTableProps {
  tickets: Ticket[];
  isPending: boolean;
  error: Error | null;
}

const statusColors: Record<TicketStatus, string> = {
  open: "default",
  pending: "secondary",
  resolved: "outline",
  closed: "outline",
};

export function TicketsTable({ tickets, isPending, error }: TicketsTableProps) {
  const columns = ["Subject", "From", "Status", "Category", "Created"];

  if (isPending) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/[0.02]">
              {columns.map((col) => (
                <TableHead key={col} className="text-slate-400">{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-white/10">
                <TableCell><Skeleton className="h-4 w-48 bg-white/10" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32 bg-white/10" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14 rounded-full bg-white/10" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full bg-white/10" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20 bg-white/10" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
        {error.message}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-white/[0.02]">
            {columns.map((col) => (
              <TableHead key={col} className="text-slate-400">{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id} className="border-white/10 hover:bg-white/[0.04]">
              <TableCell className="font-medium text-white">{ticket.subject}</TableCell>
              <TableCell className="text-slate-300">
                <div>{ticket.senderName}</div>
                <div className="text-xs text-slate-500">{ticket.senderEmail}</div>
              </TableCell>
              <TableCell>
                <Badge variant={(statusColors[ticket.status] ?? "default") as "default" | "secondary" | "outline"}>
                  {ticket.status}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-400">
                {ticket.category ?? "—"}
              </TableCell>
              <TableCell className="text-slate-400">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
          {tickets.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                No tickets found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
