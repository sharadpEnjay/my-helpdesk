import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type SortingState,
  type PaginationState,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Link } from "react-router";
import { type Ticket } from "core/schemas/ticket";
import type { TicketStatus } from "core/constants/ticket";
import { statusStyles } from "@/lib/ticket-styles";
import { getSlaSignal } from "@/lib/sla";
import { cn } from "@/lib/utils";

export type { Ticket };

interface TicketsTableProps {
  tickets: Ticket[];
  total: number;
  isPending: boolean;
  error: Error | null;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
}

/** The signature element: a live age/pressure gauge per ticket. */
function SlaPulse({ status, updatedAt }: { status: TicketStatus; updatedAt: string }) {
  const sla = getSlaSignal(status, updatedAt);
  return (
    <div className="flex items-center gap-2" title={`Waiting ${sla.label}`}>
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          sla.pulse && "sla-pulse",
        )}
        style={{ backgroundColor: sla.color }}
      />
      <span className={cn("font-mono text-xs tabular-nums", sla.textClass)}>
        {sla.label}
      </span>
    </div>
  );
}

const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "id",
    header: "ID",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        #{String(row.original.id).padStart(4, "0")}
      </span>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <Link
        to={`/tickets/${row.original.id}`}
        className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
      >
        {row.getValue("subject")}
      </Link>
    ),
  },
  {
    accessorKey: "senderName",
    header: "From",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-0">
        <div className="truncate text-sm text-foreground/90">
          {row.original.senderName}
        </div>
        <div className="truncate font-mono text-[0.7rem] text-muted-foreground">
          {row.original.senderEmail}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<TicketStatus>("status");
      return (
        <Badge variant="outline" className={cn("capitalize", statusStyles[status])}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.getValue<string | null>("category") ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Age",
    cell: ({ row }) => (
      <SlaPulse
        status={row.original.status}
        updatedAt={row.original.updatedAt}
      />
    ),
  },
];

const COL_COUNT = columns.length;

export function TicketsTable({
  tickets,
  total,
  isPending,
  error,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
}: TicketsTableProps) {
  const pageCount = Math.ceil(total / pagination.pageSize);

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(next);
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(pagination) : updater;
      onPaginationChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount,
  });

  if (error) {
    return (
      <div className="rounded-lg border border-sla-breach/25 bg-sla-breach/10 p-4 text-sm text-sla-breach">
        {error.message}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {table.getHeaderGroups()[0]?.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-10 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground select-none",
                      canSort &&
                        "cursor-pointer transition-colors hover:text-foreground",
                    )}
                    onClick={
                      canSort
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {canSort &&
                        (sorted === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : sorted === "desc" ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ArrowUpDown className="size-3 opacity-30" />
                        ))}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending
              ? Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              : table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-border transition-colors hover:bg-accent/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            {!isPending && tickets.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={COL_COUNT}
                  className="py-14 text-center"
                >
                  <p className="font-mono text-sm text-muted-foreground">
                    All clear — no tickets match.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between px-1">
          <span className="font-mono text-xs text-muted-foreground">
            {total} ticket{total !== 1 && "s"}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 font-mono text-xs tabular-nums text-foreground/80">
              {pagination.pageIndex + 1} / {pageCount}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
