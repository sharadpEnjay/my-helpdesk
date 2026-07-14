import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { SparklesIcon, ActivityIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAge } from "@/lib/sla";

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  aiResolvedCount: number;
  aiResolvedPercent: number;
  avgResolutionTimeMs: number;
}

interface TicketsPerDay {
  date: string;
  count: number;
}

function loadLevel(open: number, total: number): {
  color: string;
  label: string;
} {
  const ratio = total > 0 ? open / total : 0;
  if (ratio > 0.6) return { color: "var(--sla-breach)", label: "Heavy" };
  if (ratio > 0.3) return { color: "var(--sla-soon)", label: "Elevated" };
  return { color: "var(--sla-fresh)", label: "Nominal" };
}

function PageHeader({ open, total }: { open: number; total: number }) {
  const load = loadLevel(open, total);
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
          Overview
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard</h1>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5">
        <span
          className="size-1.5 rounded-full sla-pulse"
          style={{ backgroundColor: load.color }}
        />
        <span className="font-mono text-xs text-muted-foreground">
          Queue load
        </span>
        <span
          className="font-mono text-xs font-medium"
          style={{ color: load.color }}
        >
          {load.label}
        </span>
      </div>
    </div>
  );
}

interface Readout {
  label: string;
  value: string;
  accent: string;
  meter?: number;
  note?: string;
}

function ReadoutCluster({ stats }: { stats: DashboardStats }) {
  const items: Readout[] = [
    {
      label: "Open",
      value: String(stats.openTickets),
      accent: "var(--sla-soon)",
      meter: stats.totalTickets > 0 ? stats.openTickets / stats.totalTickets : 0,
      note: `of ${stats.totalTickets} total`,
    },
    {
      label: "Resolved by AI",
      value: String(stats.aiResolvedCount),
      accent: "var(--sla-fresh)",
      note: "auto-closed",
    },
    {
      label: "AI Deflection",
      value: `${stats.aiResolvedPercent}%`,
      accent: "var(--primary)",
      meter: stats.aiResolvedPercent / 100,
      note: "of all tickets",
    },
    {
      label: "Avg Resolution",
      value: formatAge(stats.avgResolutionTimeMs),
      accent: "var(--sla-calm)",
      note: "time to close",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="relative flex flex-col gap-3 bg-surface p-5"
        >
          <div className="flex items-center gap-2">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: item.accent }}
            />
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              {item.label}
            </p>
          </div>
          <p className="font-heading text-3xl font-semibold tabular-nums leading-none">
            {item.value}
          </p>
          {item.meter !== undefined && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(3, item.meter * 100))}%`,
                  backgroundColor: item.accent,
                }}
              />
            </div>
          )}
          {item.note && (
            <p className="font-mono text-[0.7rem] text-muted-foreground">
              {item.note}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ClusterSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-surface sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () =>
      axios
        .get<DashboardStats>("/api/dashboard/stats")
        .then((res) => res.data),
  });

  const { data: ticketsPerDay, isLoading: isChartLoading } = useQuery({
    queryKey: ["tickets-per-day"],
    queryFn: () =>
      axios
        .get<TicketsPerDay[]>("/api/dashboard/tickets-per-day")
        .then((res) => res.data),
  });

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-8">
      <PageHeader
        open={stats?.openTickets ?? 0}
        total={stats?.totalTickets ?? 0}
      />

      {isLoading || !stats ? (
        <ClusterSkeleton />
      ) : (
        <ReadoutCluster stats={stats} />
      )}

      <section className="mt-6 rounded-lg border border-border bg-surface">
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ActivityIcon className="size-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold">Inbound volume</h2>
          </div>
          <span className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
            Last 30 days
          </span>
        </header>
        <div className="p-4 sm:p-5">
          {isChartLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <BarChart
                data={ticketsPerDay}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="var(--border)"
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v + "T00:00:00");
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  interval="preserveStartEnd"
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--border)"
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    color: "var(--popover-foreground)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                  }}
                  labelFormatter={(v) => {
                    const d = new Date(String(v) + "T00:00:00");
                    return d.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Tickets"
                  fill="var(--primary)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <p className="mt-5 flex items-center gap-1.5 font-mono text-[0.7rem] text-muted-foreground">
        <SparklesIcon className="size-3 text-primary" />
        AI triages and auto-resolves inbound email before it reaches an agent.
      </p>
    </main>
  );
}
