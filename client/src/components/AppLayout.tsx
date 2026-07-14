import { Outlet } from "react-router";
import { authClient } from "@/lib/auth-client";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const { data: session } = authClient.useSession();

  return (
    <div className="min-h-screen">
      <Sidebar
        userName={session?.user?.name ?? ""}
        role={session?.user?.role ?? ""}
      />
      <div className="md:pl-60">
        <Outlet />
      </div>
    </div>
  );
}
