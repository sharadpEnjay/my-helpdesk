import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Role } from "core/schemas/user";
import { Navbar } from "../components/Navbar";
import { UsersTable } from "../components/UsersTable";
import { UserFormDialog, type DialogState } from "../components/UserFormDialog";
import { DeleteUserDialog } from "../components/DeleteUserDialog";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

interface UsersPageProps {
  userName: string;
  role?: string;
}

export function UsersPage({ userName, role }: UsersPageProps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: users = [], isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => axios.get<User[]>("/api/users").then((res) => res.data),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white/87">
      <Navbar userName={userName} role={role} />
      <div className="px-8 pb-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Users</h1>
          <Button onClick={() => setDialog("create")}>Create User</Button>
        </div>

        <UserFormDialog state={dialog} onClose={() => setDialog(null)} />
        <DeleteUserDialog user={deleteTarget} onClose={() => setDeleteTarget(null)} />
        <UsersTable users={users} isPending={isPending} error={error} onEdit={setDialog} onDelete={setDeleteTarget} />
      </div>
    </div>
  );
}
