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

const updateUserSchema = createUserSchema.partial().omit({ password: true });

// Schema for updating own profile (no role/permissions change allowed)
const updateProfileSchema = z.object({
  prenom: z.string().min(2).optional(),
  nom: z.string().min(2).optional(),
  telephone: z.string().min(8).optional(),
  email: z.string().email().optional().nullable(),
  adresse: z.string().optional(),
  theme: z.enum(["dark", "light", "system"]).optional(),
});

// Schema for password change
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const usersRouter = Router();

// Get current user profile - requires authentication (MUST be before /:id route)
usersRouter.get("/me", requireAuth, async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
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
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Erreur lors de la récupération du profil" });
  }
});

// Update current user profile - requires authentication (MUST be before /:id route)
usersRouter.patch("/me", requireAuth, async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { telephone, email } = parsed.data;

    let telephoneToSet: string | undefined;
    if (telephone !== undefined) {
      const normalized = normalizeTelephone(telephone);
      if (!normalized) return res.status(400).json({ error: "Numéro de téléphone invalide" });
      telephoneToSet = normalized;
    }

    const emailToSet = email !== undefined ? normalizeEmail(email) : undefined;

    // Check if phone already exists (if changing phone)
    if (telephoneToSet && telephoneToSet !== currentUser.telephone) {
      const existingPhone = await prisma.user.findUnique({ where: { telephone: telephoneToSet } });
      if (existingPhone) {
        return res.status(409).json({ error: "Numéro de téléphone déjà utilisé" });
      }
    }

    // Check if email already exists (if changing email)
    if (email !== undefined && emailToSet !== currentUser.email) {
      if (emailToSet) {
        const existingEmail = await prisma.user.findUnique({ where: { email: emailToSet } });
        if (existingEmail) {
          return res.status(409).json({ error: "Email déjà utilisé" });
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        ...parsed.data,
        ...(telephoneToSet !== undefined ? { telephone: telephoneToSet } : {}),
        ...(email !== undefined ? { email: emailToSet } : {}),
      },
      select: {
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
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
  }
});

// Change current user password - requires authentication (MUST be before /:id route)
usersRouter.patch("/me/password", requireAuth, async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { currentPassword, newPassword } = parsed.data;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Verify current password
    const bcrypt = await import("bcrypt");
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect" });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: "Mot de passe changé avec succès" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Erreur lors du changement de mot de passe" });
  }
});

// Get all users - requires authentication
usersRouter.get("/", requireAuth, async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    let whereClause = {};
    
    // Apply role-based filtering
    if (currentUser.role === 'EMPLOYEE') {
      // Employees can only see other employees (not admins or super admins)
      whereClause = { role: 'EMPLOYEE' };
    } else if (currentUser.role === 'ADMIN') {
      // Admins can see employees and other admins (not super admins)
      whereClause = { role: { in: ['EMPLOYEE', 'ADMIN'] } };
    }
    // Super admins can see everyone (no filtering)

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
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
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: users, total: users.length });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
  }
});

// Get user by ID - requires authentication
usersRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: String(req.params.id) },
      select: {
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
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Erreur lors de la récupération de l'utilisateur" });
  }
});

// Create user - requires super admin
usersRouter.post("/", requireSuperAdmin, async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { prenom, nom, telephone, email, adresse, role, accessPressing, accessAtelier, password } = parsed.data;
  const normalizedTelephone = normalizeTelephone(telephone);
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedTelephone) return res.status(400).json({ error: "Numéro de téléphone invalide" });

  // Check if phone already exists
  const existingPhone = await prisma.user.findUnique({ where: { telephone: normalizedTelephone } });
  if (existingPhone) {
    return res.status(409).json({ error: "Numéro de téléphone déjà utilisé" });
  }

  // Check if email already exists (if provided)
  if (normalizedEmail) {
    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }
  }

  // Hash password
  const bcrypt = await import("bcrypt");
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      prenom,
      nom,
      telephone: normalizedTelephone,
      email: normalizedEmail,
      adresse,
      role,
      accessPressing,
      accessAtelier,
      passwordHash,
    },
    select: {
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
    },
  });

  res.status(201).json(user);
});

// Update user - requires super admin
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
        return res.status(400).json({ error: "Numéro de téléphone invalide" });
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
      select: {
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
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
  }
});

// Delete user - requires super admin
usersRouter.delete("/:id", requireSuperAdmin, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
  }
});
