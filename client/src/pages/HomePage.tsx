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
import {
  TicketIcon,
  InboxIcon,
  SparklesIcon,
  PercentIcon,
  ClockIcon,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HomePageProps {
  userName: string;
  role?: string;
}

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

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function StatCardSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-4 p-5">
        <Skeleton className="size-11 rounded-xl" />
        <div className="grid gap-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function HomePage({ userName, role }: HomePageProps) {
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

  const cards = [
    {
      title: "Total Tickets",
      value: stats?.totalTickets ?? 0,
      icon: TicketIcon,
      tint: "bg-violet-500/15 text-violet-400",
    },
    {
      title: "Open Tickets",
      value: stats?.openTickets ?? 0,
      icon: InboxIcon,
      tint: "bg-amber-500/15 text-amber-400",
    },
    {
      title: "Resolved by AI",
      value: stats?.aiResolvedCount ?? 0,
      icon: SparklesIcon,
      tint: "bg-emerald-500/15 text-emerald-400",
    },
    {
      title: "AI Resolution Rate",
      value: `${stats?.aiResolvedPercent ?? 0}%`,
      icon: PercentIcon,
      tint: "bg-sky-500/15 text-sky-400",
    },
    {
      title: "Avg. Resolution Time",
      value: formatDuration(stats?.avgResolutionTimeMs ?? 0),
      icon: ClockIcon,
      tint: "bg-rose-500/15 text-rose-400",
    },
  ];

  return (
    <div className="min-h-screen text-foreground">
      <Navbar userName={userName} role={role} />
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of ticket activity and AI performance
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            : cards.map((card) => (
                <Card
                  key={card.title}
                  className="border-border/60 transition-colors hover:border-border"
                >
                  <CardContent className="flex items-center gap-4 p-5">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${card.tint}`}
                    >
                      <card.icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-muted-foreground">
                        {card.title}
                      </p>
                      <p className="text-2xl font-bold tabular-nums">
                        {card.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <Card className="mt-6 border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Tickets per Day
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                Last 30 days
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isChartLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={288}>
                <BarChart
                  data={ticketsPerDay}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="var(--border)"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v + "T00:00:00");
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="var(--border)"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                      color: "var(--popover-foreground)",
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
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
