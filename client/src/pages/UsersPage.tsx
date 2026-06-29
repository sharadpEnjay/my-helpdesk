import { Navbar } from "../components/Navbar";

interface UsersPageProps {
  userName: string;
  role?: string;
}

export function UsersPage({ userName, role }: UsersPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white/87">
      <Navbar userName={userName} role={role} />
      <div className="px-8 pb-8 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold">Users</h1>
      </div>
    </div>
  );
}
