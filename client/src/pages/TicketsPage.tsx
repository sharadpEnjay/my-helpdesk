import { useState, useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SortingState, PaginationState } from "@tanstack/react-table";
import axios from "axios";
import { TicketsTable, type Ticket } from "../components/TicketsTable";
import { TicketFilters, type TicketFilterValues } from "../components/TicketFilters";

interface TicketsResponse {
  data: Ticket[];
  total: number;
  page: number;
  pageSize: number;
}

export function TicketsPage() {

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
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
            Support
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Tickets</h1>
        </div>
        {data && (
          <span className="font-mono text-xs text-muted-foreground">
            <span className="tabular-nums text-foreground/80">{data.total}</span>{" "}
            in queue
          </span>
        )}
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
    </main>
  );
}
