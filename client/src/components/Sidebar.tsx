import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router";
import {
  LayoutDashboardIcon,
  TicketIcon,
  UsersIcon,
  LogOutIcon,
  RadioTowerIcon,
} from "lucide-react";
import { Role } from "core/constants/user";
import { authClient } from "../lib/auth-client";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userName: string;
  role?: string;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function navLinks(role?: string) {
  return [
    { to: "/", label: "Dashboard", icon: LayoutDashboardIcon, end: true },
    { to: "/tickets", label: "Queue", icon: TicketIcon, end: false },
    ...(role === Role.admin
      ? [{ to: "/users", label: "Agents", icon: UsersIcon, end: false }]
      : []),
  ];
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="relative flex size-9 items-center justify-center rounded-md bg-primary/12 text-primary ring-1 ring-primary/25">
        <RadioTowerIcon className="size-5" />
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-sla-fresh ring-2 ring-sidebar sla-pulse" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-heading text-[0.95rem] font-semibold tracking-tight text-foreground">
          Helpdesk
        </span>
        <span className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
          Control Room
        </span>
      </span>
    </Link>
  );
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
  );
}

export function Sidebar({ userName, role }: SidebarProps) {
  const clock = useClock();
  const links = navLinks(role);
  const handleSignOut = async () => {
    await authClient.signOut();
  };

  const time = clock.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          <p className="px-3 pb-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground/70">
            Operations
          </p>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <Icon className="size-[1.1rem] shrink-0" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-3">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-sla-fresh sla-pulse" />
            <span className="tabular-nums text-foreground/80">{time}</span>
            <span className="text-muted-foreground/60">local</span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-sidebar-border px-5 py-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
            {userName.slice(0, 2).toUpperCase() || "??"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {userName || "Agent"}
            </p>
            <p className="truncate font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {role || "agent"}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOutIcon className="size-4" />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-sidebar-border bg-sidebar/90 px-4 backdrop-blur-xl md:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                cn(
                  "flex size-9 items-center justify-center rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )
              }
            >
              <Icon className="size-[1.15rem]" />
            </NavLink>
          ))}
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOutIcon className="size-[1.15rem]" />
          </button>
        </div>
      </header>
    </>
  );
}
