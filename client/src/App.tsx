import { Routes, Route, Navigate } from "react-router";
import { authClient } from "@/lib/auth-client";
import { LoginPage } from "@/pages/LoginPage";
import { HomePage } from "@/pages/HomePage";
import { UsersPage } from "@/pages/UsersPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import "./App.css";

function App() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-3 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route element={<ProtectedRoute />}>
        <Route
          path="/"
          element={
            <HomePage
              userName={session?.user?.name ?? ""}
              role={session?.user?.role ?? ""}
            />
          }
        />
        <Route element={<AdminRoute />}>
          <Route
            path="/users"
            element={
              <UsersPage
                userName={session?.user?.name ?? ""}
                role={session?.user?.role ?? ""}
              />
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
