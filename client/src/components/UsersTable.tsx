import { PencilIcon, Trash2Icon } from "lucide-react";
import { Role } from "core/schemas/user";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

interface UsersTableProps {
  users: User[];
  isPending: boolean;
  error: Error | null;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UsersTable({ users, isPending, error, onEdit, onDelete }: UsersTableProps) {
  if (isPending) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/[0.02]">
              <TableHead className="text-slate-400">Name</TableHead>
              <TableHead className="text-slate-400">Email</TableHead>
              <TableHead className="text-slate-400">Role</TableHead>
              <TableHead className="text-slate-400">Joined</TableHead>
              <TableHead className="text-slate-400 w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-white/10">
                <TableCell><Skeleton className="h-4 w-24 bg-white/10" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40 bg-white/10" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14 rounded-full bg-white/10" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20 bg-white/10" /></TableCell>
                <TableCell></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
        {error.message}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-white/[0.02]">
            <TableHead className="text-slate-400">Name</TableHead>
            <TableHead className="text-slate-400">Email</TableHead>
            <TableHead className="text-slate-400">Role</TableHead>
            <TableHead className="text-slate-400">Joined</TableHead>
            <TableHead className="text-slate-400 w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="border-white/10 hover:bg-white/[0.04]">
              <TableCell className="font-medium text-white">{user.name}</TableCell>
              <TableCell className="text-slate-300">{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === Role.admin ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-400">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-slate-400 hover:text-white hover:bg-white/10"
                  onClick={() => onEdit(user)}
                  aria-label={`Edit ${user.name}`}
                >
                  <PencilIcon />
                </Button>
                {user.role !== Role.admin && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => onDelete(user)}
                    aria-label={`Delete ${user.name}`}
                  >
                    <Trash2Icon />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                No users found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
