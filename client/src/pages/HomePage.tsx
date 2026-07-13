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
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-20" />
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
      color: "text-blue-400",
    },
    {
      title: "Open Tickets",
      value: stats?.openTickets ?? 0,
      color: "text-amber-400",
    },
    {
      title: "Resolved by AI",
      value: stats?.aiResolvedCount ?? 0,
      color: "text-emerald-400",
    },
    {
      title: "AI Resolution Rate",
      value: `${stats?.aiResolvedPercent ?? 0}%`,
      color: "text-purple-400",
    },
    {
      title: "Avg. Resolution Time",
      value: formatDuration(stats?.avgResolutionTimeMs ?? 0),
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white/87">
      <Navbar userName={userName} role={role} />
      <div className="px-8 pb-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            : cards.map((card) => (
                <Card key={card.title}>
                  <CardHeader>
                    <CardTitle className="text-muted-foreground text-sm font-medium">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-bold ${card.color}`}>
                      {card.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tickets per Day (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isChartLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={288}>
                <BarChart data={ticketsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v + "T00:00:00");
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                    labelFormatter={(v: string) => {
                      const d = new Date(v + "T00:00:00");
                      return d.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                  />
                  <Bar dataKey="count" name="Tickets" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
