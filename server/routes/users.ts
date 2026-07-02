import { Router, Request, Response } from "express";
import { Role } from "@prisma/client";
import { hashPassword, generateRandomString } from "better-auth/crypto";
import { requireAuth, requireRole } from "../middleware/auth";
import prisma from "../db";
import { createUserSchema } from "core/schemas/user";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

router.post("/", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0]!.message });
    return;
  }

  const { name, email, password } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "A user with this email already exists" });
    return;
  }

  const now = new Date();
  const userId = generateRandomString(32);
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      id: userId,
      name,
      email,
      role: Role.agent,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      accounts: {
        create: {
          id: generateRandomString(32),
          accountId: userId,
          providerId: "credential",
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        },
      },
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  res.status(201).json(user);
});

export default router;
