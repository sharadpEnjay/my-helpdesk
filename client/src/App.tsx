import { Routes, Route, Navigate } from "react-router";
import { authClient } from "./lib/auth-client";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import "./App.css";

function App() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          session ? (
            <HomePage userName={session.user.name} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
