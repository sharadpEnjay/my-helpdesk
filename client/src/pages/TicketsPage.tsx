import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { TicketStatus, TicketCategory } from "core/constants/ticket";
import { Navbar } from "../components/Navbar";
import { TicketsTable } from "../components/TicketsTable";

interface Ticket {
  id: number;
  subject: string;
  senderName: string;
  senderEmail: string;
  status: TicketStatus;
  category: TicketCategory | null;
  createdAt: string;
}

interface TicketsPageProps {
  userName: string;
  role?: string;
}

export function TicketsPage({ userName, role }: TicketsPageProps) {
  const { data: tickets = [], isPending, error } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => axios.get<Ticket[]>("/api/tickets").then((res) => res.data),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white/87">
      <Navbar userName={userName} role={role} />
      <div className="px-8 pb-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Tickets</h1>
        </div>

        <TicketsTable tickets={tickets} isPending={isPending} error={error} />
      </div>
    </div>
  );
}
