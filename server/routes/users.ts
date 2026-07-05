import { Router, type Request, type Response } from "express";
import { Role as PrismaRole } from "@prisma/client";
import { hashPassword, generateRandomString } from "better-auth/crypto";
import { requireAuth, requireRole } from "../middleware/auth";
import { parseBody } from "../utils/validation";
import prisma from "../db";
import { createUserSchema, updateUserSchema } from "core/schemas/user";
import { Role } from "core/constants/user";

const router = Router();

router.get("/", requireAuth, requireRole(Role.admin), async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

router.post("/", requireAuth, requireRole(Role.admin), async (req: Request, res: Response) => {
  const data = parseBody(createUserSchema, req.body, res);
  if (!data) return;

  const { name, email, password, role } = data;

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
      role: role === Role.admin ? PrismaRole.admin : PrismaRole.agent,
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

router.patch("/:id", requireAuth, requireRole(Role.admin), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = parseBody(updateUserSchema, req.body, res);
  if (!data) return;

  const { name, email, password, role } = data;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }
  }

  const updateData: { name: string; email: string; role: Role; updatedAt: Date } = {
    name,
    email,
    role: role === Role.admin ? PrismaRole.admin : PrismaRole.agent,
    updatedAt: new Date(),
  };

  if (password) {
    const hashedPassword = await hashPassword(password);
    await prisma.account.updateMany({
      where: { userId: existing.id, providerId: "credential" },
      data: { password: hashedPassword, updatedAt: new Date() },
    });
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  res.json(user);
});

router.delete("/:id", requireAuth, requireRole(Role.admin), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.role === PrismaRole.admin) {
    res.status(403).json({ error: "Admin users cannot be deleted" });
    return;
  }

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.status(204).end();
});

export default router;
