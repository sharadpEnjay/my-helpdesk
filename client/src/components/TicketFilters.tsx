import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/FilterSelect";
import { Search, X } from "lucide-react";
import { TicketStatus, TicketCategory } from "core/constants/ticket";

export interface TicketFilterValues {
  status: string;
  category: string;
  search: string;
}

interface TicketFiltersProps {
  filters: TicketFilterValues;
  onFiltersChange: (filters: TicketFilterValues) => void;
}

const statusOptions = Object.values(TicketStatus)
  .filter((s) => s !== "new" && s !== "processing")
  .map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  }));

const categoryLabels: Record<string, string> = {
  general: "General",
  billing: "Billing",
  technical: "Technical",
  bug: "Bug",
  feature_request: "Feature Request",
};

const categoryOptions = Object.values(TicketCategory).map((c) => ({
  value: c,
  label: categoryLabels[c] ?? c,
}));

export function TicketFilters({ filters, onFiltersChange }: TicketFiltersProps) {
  const update = (patch: Partial<TicketFilterValues>) =>
    onFiltersChange({ ...filters, ...patch });

  const hasActiveFilters = filters.status || filters.category || filters.search;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tickets..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="w-56 pl-8"
        />
      </div>

      <FilterSelect
        value={filters.status}
        onChange={(v) => update({ status: v })}
        placeholder="Status"
        allLabel="All Statuses"
        options={statusOptions}
        className="w-32"
      />

      <FilterSelect
        value={filters.category}
        onChange={(v) => update({ category: v })}
        placeholder="Category"
        allLabel="All Categories"
        options={categoryOptions}
        className="w-40"
      />

      {hasActiveFilters && (
        <button
          onClick={() => onFiltersChange({ status: "", category: "", search: "" })}
          className="flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-3" />
          Clear
        </button>
      )}
    </div>
  );
}
