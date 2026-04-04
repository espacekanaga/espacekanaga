import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma/prismaClient";
import { requireAuth, requireSuperAdmin } from "../middlewares/auth.middleware";
import { normalizeEmail, normalizeTelephone } from "../utils/normalize";

const createUserSchema = z.object({
  prenom: z.string().min(2),
  nom: z.string().min(2),
  telephone: z.string().min(8),
  email: z.string().email().optional(),
  adresse: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EMPLOYEE"]).default("EMPLOYEE"),
  accessPressing: z.boolean().default(false),
  accessAtelier: z.boolean().default(false),
  password: z.string().min(6),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  isActive: z.boolean().optional(),
});

const updateProfileSchema = z.object({
  prenom: z.string().min(2).optional(),
  nom: z.string().min(2).optional(),
  telephone: z.string().min(8).optional(),
  email: z.string().email().optional().nullable(),
  adresse: z.string().optional(),
  theme: z.enum(["dark", "light", "system"]).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const userSelect = {
  id: true,
  prenom: true,
  nom: true,
  telephone: true,
  email: true,
  adresse: true,
  role: true,
  isActive: true,
  accessPressing: true,
  accessAtelier: true,
  theme: true,
  createdAt: true,
  updatedAt: true,
} as const;

function forbidClientRole(req: Express.Request, res: any) {
  if (req.user?.role === "CLIENT") {
    res.status(403).json({ error: "Acces refuse" });
    return true;
  }
  return false;
}

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifie" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: userSelect,
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouve" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Erreur lors de la recuperation du profil" });
  }
});

usersRouter.patch("/me", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifie" });
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    let telephoneToSet: string | undefined;
    if (parsed.data.telephone !== undefined) {
      const normalized = normalizeTelephone(parsed.data.telephone);
      if (!normalized) return res.status(400).json({ error: "Numero de telephone invalide" });
      telephoneToSet = normalized;
    }

    const emailToSet = parsed.data.email !== undefined ? normalizeEmail(parsed.data.email) : undefined;

    if (telephoneToSet && telephoneToSet !== req.user.telephone) {
      const existingPhone = await prisma.user.findUnique({ where: { telephone: telephoneToSet }, select: { id: true } });
      if (existingPhone) {
        return res.status(409).json({ error: "Numero de telephone deja utilise" });
      }
    }

    if (parsed.data.email !== undefined && emailToSet !== req.user.email) {
      if (emailToSet) {
        const existingEmail = await prisma.user.findUnique({ where: { email: emailToSet }, select: { id: true } });
        if (existingEmail) {
          return res.status(409).json({ error: "Email deja utilise" });
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...parsed.data,
        ...(telephoneToSet !== undefined ? { telephone: telephoneToSet } : {}),
        ...(parsed.data.email !== undefined ? { email: emailToSet } : {}),
      },
      select: userSelect,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Erreur lors de la mise a jour du profil" });
  }
});

usersRouter.patch("/me/password", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifie" });
    }

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, passwordHash: true } });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouve" });
    }

    const bcrypt = await import("bcrypt");
    const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect" });
    }

    const newPasswordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash },
      select: { id: true },
    });

    res.json({ message: "Mot de passe change avec succes" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Erreur lors du changement de mot de passe" });
  }
});

usersRouter.get("/", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifie" });
    }
    if (forbidClientRole(req, res)) return;

    let whereClause = {};
    if (req.user.role === "EMPLOYEE") {
      whereClause = { role: "EMPLOYEE" };
    } else if (req.user.role === "ADMIN") {
      whereClause = { role: { in: ["EMPLOYEE", "ADMIN"] } };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: users, total: users.length });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Erreur lors de la recuperation des utilisateurs" });
  }
});

usersRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    if (forbidClientRole(req, res)) return;

    const user = await prisma.user.findUnique({
      where: { id: String(req.params.id) },
      select: userSelect,
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouve" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Erreur lors de la recuperation de l'utilisateur" });
  }
});

usersRouter.post("/", requireSuperAdmin, async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const normalizedTelephone = normalizeTelephone(parsed.data.telephone);
  const normalizedEmail = normalizeEmail(parsed.data.email);
  if (!normalizedTelephone) return res.status(400).json({ error: "Numero de telephone invalide" });

  const existingPhone = await prisma.user.findUnique({ where: { telephone: normalizedTelephone }, select: { id: true } });
  if (existingPhone) {
    return res.status(409).json({ error: "Numero de telephone deja utilise" });
  }

  if (normalizedEmail) {
    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
    if (existingEmail) {
      return res.status(409).json({ error: "Email deja utilise" });
    }
  }

  const bcrypt = await import("bcrypt");
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      prenom: parsed.data.prenom,
      nom: parsed.data.nom,
      telephone: normalizedTelephone,
      email: normalizedEmail,
      adresse: parsed.data.adresse,
      role: parsed.data.role,
      accessPressing: parsed.data.accessPressing,
      accessAtelier: parsed.data.accessAtelier,
      passwordHash,
    },
    select: userSelect,
  });

  res.status(201).json(user);
});

usersRouter.patch("/:id", requireSuperAdmin, async (req, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    let telephoneToSet: string | undefined;
    if (parsed.data.telephone !== undefined) {
      const normalized = normalizeTelephone(parsed.data.telephone);
      if (!normalized) {
        return res.status(400).json({ error: "Numero de telephone invalide" });
      }
      telephoneToSet = normalized;
    }

    const emailToSet = parsed.data.email !== undefined ? normalizeEmail(parsed.data.email) : undefined;

    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: {
        ...parsed.data,
        ...(telephoneToSet !== undefined ? { telephone: telephoneToSet } : {}),
        ...(parsed.data.email !== undefined ? { email: emailToSet } : {}),
      },
      select: userSelect,
    });

    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Erreur lors de la mise a jour de l'utilisateur" });
  }
});

usersRouter.delete("/:id", requireSuperAdmin, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
  }
});
