import { z } from "zod";

export const Role = { admin: "admin", agent: "agent" } as const;
export type Role = (typeof Role)[keyof typeof Role];

const roleEnum = z.enum(["admin", "agent"]);

export const createUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().trim().pipe(z.email("Invalid email address")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: roleEnum,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().trim().pipe(z.email("Invalid email address")),
  password: z.string().min(8, "Password must be at least 8 characters").or(z.literal("")),
  role: roleEnum,
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
