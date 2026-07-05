import { useState, useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import axios from "axios";
import { Navbar } from "../components/Navbar";
import { TicketsTable, type Ticket } from "../components/TicketsTable";
import { TicketFilters, type TicketFilterValues } from "../components/TicketFilters";

interface TicketsPageProps {
  userName: string;
  role?: string;
}

export function TicketsPage({ userName, role }: TicketsPageProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [filters, setFilters] = useState<TicketFilterValues>({
    status: "",
    category: "",
    search: "",
  });

  const deferredSearch = useDeferredValue(filters.search);

  const { data: tickets = [], isPending, error } = useQuery({
    queryKey: ["tickets", sorting, filters.status, filters.category, deferredSearch],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (sorting.length > 0) {
        params.sortBy = sorting[0]!.id;
        params.sortOrder = sorting[0]!.desc ? "desc" : "asc";
      }
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (deferredSearch) params.search = deferredSearch;
      return axios.get<Ticket[]>("/api/tickets", { params }).then((res) => res.data);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white/87">
      <Navbar userName={userName} role={role} />
      <div className="px-8 pb-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Tickets</h1>
        </div>

        <TicketFilters filters={filters} onFiltersChange={setFilters} />

        <TicketsTable
          tickets={tickets}
          isPending={isPending}
          error={error}
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </div>
    </div>
  );
}
