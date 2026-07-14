import { PencilIcon, Trash2Icon } from "lucide-react";
import { Role } from "core/constants/user";
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

const HEAD_CLASS =
  "h-10 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground";

function HeaderRow() {
  return (
    <TableRow className="border-border hover:bg-transparent">
      <TableHead className={HEAD_CLASS}>Name</TableHead>
      <TableHead className={HEAD_CLASS}>Email</TableHead>
      <TableHead className={HEAD_CLASS}>Role</TableHead>
      <TableHead className={HEAD_CLASS}>Joined</TableHead>
      <TableHead className={`${HEAD_CLASS} w-12`}></TableHead>
    </TableRow>
  );
}

export function UsersTable({ users, isPending, error, onEdit, onDelete }: UsersTableProps) {
  if (isPending) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <HeaderRow />
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-border">
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
      <div className="rounded-lg border border-sla-breach/25 bg-sla-breach/10 p-4 text-sm text-sla-breach">
        {error.message}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <HeaderRow />
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="border-border transition-colors hover:bg-accent/50">
              <TableCell className="py-3 font-medium text-foreground">{user.name}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === Role.admin ? "default" : "secondary"} className="capitalize">
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(user)}
                  aria-label={`Edit ${user.name}`}
                >
                  <PencilIcon />
                </Button>
                {user.role !== Role.admin && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="hover:bg-sla-breach/10 hover:text-sla-breach"
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
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="py-14 text-center font-mono text-sm text-muted-foreground">
                No agents yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
