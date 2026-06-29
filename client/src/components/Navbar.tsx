import { Link } from "react-router";
import { authClient } from "../lib/auth-client";

interface NavbarProps {
  userName: string;
  role?: string;
}

export function Navbar({ userName, role }: NavbarProps) {
  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <nav className="flex items-center justify-between px-8 py-4 mb-8 mx-8 mt-8 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent no-underline">
          Helpdesk
        </Link>
        {role === "admin" && (
          <Link to="/users" className="text-slate-400 font-medium hover:text-white transition-colors duration-200 no-underline">
            Users
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-slate-400 font-medium">{userName}</span>
        <button
          className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg cursor-pointer font-medium transition-all duration-200 hover:bg-white/10 hover:border-white/20"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
