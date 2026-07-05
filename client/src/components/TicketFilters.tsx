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

const statusOptions = Object.values(TicketStatus).map((s) => ({
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
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
        <Input
          placeholder="Search tickets..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="pl-8 w-56 bg-white/[0.03] border-white/10 text-white placeholder:text-slate-500"
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
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/[0.05]"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
