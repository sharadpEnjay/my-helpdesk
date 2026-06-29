import { Navigate, Outlet } from "react-router";
import { authClient } from "@/lib/auth-client";

export function AdminRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  if (session?.user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
