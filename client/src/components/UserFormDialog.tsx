import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from "core/schemas/user";
import { Role } from "core/constants/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export type DialogState = User | "create" | null;

interface UserFormDialogProps {
  state: DialogState;
  onClose: () => void;
}

export function UserFormDialog({ state, onClose }: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = state !== null && state !== "create";

  const form = useForm<CreateUserInput | UpdateUserInput>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: Role.agent },
  });

  useEffect(() => {
    if (isEditing) {
      form.reset({ name: state.name, email: state.email, password: "", role: state.role });
    } else if (state === "create") {
      form.reset({ name: "", email: "", password: "", role: Role.agent });
    }
  }, [state, isEditing, form]);

  const mutation = useMutation({
    mutationFn: (data: CreateUserInput | UpdateUserInput) =>
      isEditing
        ? axios.patch(`/api/users/${state.id}`, data)
        : axios.post("/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleClose();
    },
    onError: (err: AxiosError<{ error: string }>) => {
      form.setError("root", {
        message: err.response?.data?.error ?? (isEditing ? "Failed to update user" : "Failed to create user"),
      });
    },
  });

  function handleClose() {
    form.reset();
    mutation.reset();
    onClose();
  }

  return (
    <Dialog open={state !== null} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? "Edit User" : "Create New User"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              aria-invalid={!!form.formState.errors.name}
              placeholder="Full name"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-400">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              aria-invalid={!!form.formState.errors.email}
              placeholder="user@example.com"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="role"
                    aria-invalid={!!form.formState.errors.role}
                    className="bg-white/5 border-white/10 text-white"
                  >
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value={Role.admin} className="text-white">Admin</SelectItem>
                    <SelectItem value={Role.agent} className="text-white">Agent</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.role && (
              <p className="text-sm text-red-400">{form.formState.errors.role.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              aria-invalid={!!form.formState.errors.password}
              placeholder={isEditing ? "Leave blank to keep current" : "Minimum 8 characters"}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>
            )}
          </div>
          {form.formState.errors.root && (
            <p className="text-sm text-red-400">{form.formState.errors.root.message}</p>
          )}
          <DialogFooter className="bg-transparent border-0 mx-0 mb-0 p-0">
            <Button type="button" variant="ghost" className="text-white hover:bg-white/10" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? (isEditing ? "Saving..." : "Creating...")
                : (isEditing ? "Save Changes" : "Create User")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
