import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type SortingState,
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
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { TicketStatus, TicketCategory } from "core/constants/ticket";

export interface Ticket {
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
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
}

const statusColors: Record<TicketStatus, string> = {
  open: "default",
  pending: "secondary",
  resolved: "outline",
  closed: "outline",
};

const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <span className="font-medium text-white">{row.getValue("subject")}</span>
    ),
  },
  {
    accessorKey: "senderName",
    header: "From",
    cell: ({ row }) => (
      <div className="text-slate-300">
        <div>{row.original.senderName}</div>
        <div className="text-xs text-slate-500">{row.original.senderEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<TicketStatus>("status");
      return (
        <Badge variant={(statusColors[status] ?? "default") as "default" | "secondary" | "outline"}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <span className="text-slate-400">
        {row.getValue<string | null>("category") ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-slate-400">
        {new Date(row.getValue<string>("createdAt")).toLocaleDateString()}
      </span>
    ),
  },
];

export function TicketsTable({ tickets, isPending, error, sorting, onSortingChange }: TicketsTableProps) {
  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  if (isPending) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/[0.02]">
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <TableHead key={header.id} className="text-slate-400">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
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
            {table.getHeaderGroups()[0]?.headers.map((header) => {
              const sorted = header.column.getIsSorted();
              return (
                <TableHead
                  key={header.id}
                  className="text-slate-400 cursor-pointer select-none hover:text-slate-200 transition-colors"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {sorted === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : sorted === "desc" ? (
                      <ArrowDown className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="border-white/10 hover:bg-white/[0.04]">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
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
