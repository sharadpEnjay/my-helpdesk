import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Navbar } from "../components/Navbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  createdAt: string;
}

interface UsersPageProps {
  userName: string;
  role?: string;
}

export function UsersPage({ userName, role }: UsersPageProps) {
  const { data: users = [], isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => axios.get<User[]>("/api/users").then((res) => res.data),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white/87">
      <Navbar userName={userName} role={role} />
      <div className="px-8 pb-8 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Users</h1>

        {isPending && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-slate-600 border-t-purple-400 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {error.message}
          </div>
        )}

        {!isPending && !error && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/[0.02]">
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Role</TableHead>
                  <TableHead className="text-slate-400">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-white/10 hover:bg-white/[0.04]">
                    <TableCell className="font-medium text-white">{user.name}</TableCell>
                    <TableCell className="text-slate-300">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
