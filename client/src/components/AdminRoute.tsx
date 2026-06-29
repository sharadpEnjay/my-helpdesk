import { Navigate, Outlet } from "react-router";
import { authClient } from "@/lib/auth-client";

export function AdminRoute() {
  const { data: session } = authClient.useSession();

  if (session?.user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
