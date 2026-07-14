import { Link, NavLink } from "react-router";
import {
  LayoutDashboardIcon,
  TicketIcon,
  UsersIcon,
  LogOutIcon,
  LifeBuoyIcon,
} from "lucide-react";
import { Role } from "core/constants/user";
import { authClient } from "../lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
  userName: string;
  role?: string;
}

export function Navbar({ userName, role }: NavbarProps) {
  const handleSignOut = async () => {
    await authClient.signOut();
  };

  const links = [
    { to: "/", label: "Dashboard", icon: LayoutDashboardIcon, end: true },
    { to: "/tickets", label: "Tickets", icon: TicketIcon, end: false },
    ...(role === Role.admin
      ? [{ to: "/users", label: "Users", icon: UsersIcon, end: false }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/" className="mr-1 flex items-center gap-2 sm:mr-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
              <LifeBuoyIcon className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">Helpdesk</span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )
                }
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
            {userName}
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOutIcon className="size-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
