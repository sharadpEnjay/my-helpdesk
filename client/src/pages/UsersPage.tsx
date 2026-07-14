import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Role } from "core/constants/user";
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

export function UsersPage() {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: users = [], isPending, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => axios.get<User[]>("/api/users").then((res) => res.data),
  });

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Agents</h1>
        </div>
        <Button onClick={() => setDialog("create")}>Create User</Button>
      </div>

      <UserFormDialog state={dialog} onClose={() => setDialog(null)} />
      <DeleteUserDialog user={deleteTarget} onClose={() => setDeleteTarget(null)} />
      <UsersTable users={users} isPending={isPending} error={error} onEdit={setDialog} onDelete={setDeleteTarget} />
    </main>
  );
}
