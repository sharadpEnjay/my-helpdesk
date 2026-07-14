import { useState, useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SortingState, PaginationState } from "@tanstack/react-table";
import axios from "axios";
import { Navbar } from "../components/Navbar";
import { TicketsTable, type Ticket } from "../components/TicketsTable";
import { TicketFilters, type TicketFilterValues } from "../components/TicketFilters";

interface TicketsResponse {
  data: Ticket[];
  total: number;
  page: number;
  pageSize: number;
}

interface TicketsPageProps {
  userName: string;
  role?: string;
}

export function TicketsPage({ userName, role }: TicketsPageProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [filters, setFilters] = useState<TicketFilterValues>({
    status: "",
    category: "",
    search: "",
  });

  const deferredSearch = useDeferredValue(filters.search);

  const { data, isPending, error } = useQuery({
    queryKey: ["tickets", sorting, pagination, filters.status, filters.category, deferredSearch],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (sorting.length > 0) {
        params.sortBy = sorting[0]!.id;
        params.sortOrder = sorting[0]!.desc ? "desc" : "asc";
      }
      params.page = String(pagination.pageIndex + 1);
      params.pageSize = String(pagination.pageSize);
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (deferredSearch) params.search = deferredSearch;
      return axios.get<TicketsResponse>("/api/tickets", { params }).then((res) => res.data);
    },
  });

  const handleFiltersChange = (newFilters: TicketFilterValues) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  return (
    <div className="min-h-screen text-foreground">
      <Navbar userName={userName} role={role} />
      <div className="px-8 pb-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Tickets</h1>
        </div>

        <TicketFilters filters={filters} onFiltersChange={handleFiltersChange} />

        <TicketsTable
          tickets={data?.data ?? []}
          total={data?.total ?? 0}
          isPending={isPending}
          error={error}
          sorting={sorting}
          onSortingChange={setSorting}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      </div>
    </div>
  );
}
