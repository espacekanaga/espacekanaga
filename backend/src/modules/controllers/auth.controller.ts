import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import crypto from "crypto";

import { env } from "../../env";
import { prisma } from "../../prisma/prismaClient";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRoles } from "../middlewares/rbac.middleware";
import type { UserRole } from "../../types/roles";
import { normalizeEmail, normalizeTelephone } from "../utils/normalize";

const loginSchema = z
  .object({
    telephone: z.string().min(8).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6),
  })
  .refine((v) => Boolean(v.telephone || v.email), {
    message: "Fournir un téléphone ou un email",
    path: ["telephone"],
  });

const registerSchema = z.object({
  prenom: z.string().min(2),
  nom: z.string().min(2),
  telephone: z.string().min(8),
  email: z.string().email().optional(),
  password: z.string().min(6),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EMPLOYEE"]).optional(),
  accessPressing: z.boolean().optional().default(false),
  accessAtelier: z.boolean().optional().default(false),
});

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function parseExpiresInToDate(expiresIn: string) {
  const m = /^([0-9]+)([smhd])$/.exec(expiresIn.trim());
  if (!m) throw new Error("Invalid expiresIn format");
  const value = Number(m[1]);
  const unit = m[2];
  const seconds =
    unit === "s"
      ? value
      : unit === "m"
        ? value * 60
        : unit === "h"
          ? value * 60 * 60
          : value * 60 * 60 * 24;
  return new Date(Date.now() + seconds * 1000);
}

// Full user type for JWT token
interface TokenUser {
  id: string;
  role: UserRole;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  accessPressing: boolean;
  accessAtelier: boolean;
  theme: string;
}

function signAccessToken(user: TokenUser) {
  return jwt.sign({ 
    sub: user.id, 
    role: user.role, 
    prenom: user.prenom,
    nom: user.nom,
    telephone: user.telephone,
    email: user.email,
    accessPressing: user.accessPressing,
    accessAtelier: user.accessAtelier,
    theme: user.theme,
    typ: "access" 
  }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function signRefreshToken(user: { id: string; role: UserRole }, jti: string) {
  return jwt.sign({ sub: user.id, role: user.role, typ: "refresh", jti }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

async function issueTokens(user: TokenUser) {
  const accessToken = signAccessToken(user);

  const jti = crypto.randomUUID();
  const refreshToken = signRefreshToken(user, jti);
  const tokenHash = sha256(refreshToken);
  const expiresAt = parseExpiresInToDate(env.JWT_REFRESH_EXPIRES_IN);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { telephone, email, password } = parsed.data;
  const normalizedTelephone = normalizeTelephone(telephone);
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(normalizedTelephone ? [{ telephone: normalizedTelephone }] : []),
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ],
    },
  });
  if (!user) return res.status(401).json({ error: "Identifiants invalides" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Identifiants invalides" });

  if (!user.isActive) return res.status(403).json({ error: "Utilisateur désactivé" });

  const tokenUser: TokenUser = {
    id: user.id,
    role: user.role,
    prenom: user.prenom,
    nom: user.nom,
    telephone: user.telephone,
    email: user.email,
    accessPressing: user.accessPressing,
    accessAtelier: user.accessAtelier,
    theme: user.theme,
  };

  const { accessToken, refreshToken } = await issueTokens(tokenUser);
  return res.json({
    accessToken,
    refreshToken,
    user: { 
      id: user.id, 
      prenom: user.prenom, 
      nom: user.nom, 
      telephone: user.telephone, 
      email: user.email, 
      role: user.role, 
      accessPressing: user.accessPressing, 
      accessAtelier: user.accessAtelier,
      theme: user.theme,
    },
  });
});

authRouter.post("/refresh", async (req, res) => {
  const schema = z.object({ refreshToken: z.string().min(20) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { refreshToken } = parsed.data;

  let payload: any;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ error: "Refresh token invalide" });
  }

  if (payload?.typ !== "refresh") return res.status(401).json({ error: "Refresh token invalide" });

  const tokenHash = sha256(refreshToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!record) return res.status(401).json({ error: "Refresh token invalide" });
  if (record.revokedAt) return res.status(401).json({ error: "Refresh token révoqué" });
  if (record.expiresAt.getTime() <= Date.now()) return res.status(401).json({ error: "Refresh token expiré" });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });
  if (!user.isActive) return res.status(403).json({ error: "Utilisateur désactivé" });

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const tokenUser: TokenUser = {
    id: user.id,
    role: user.role,
    prenom: user.prenom,
    nom: user.nom,
    telephone: user.telephone,
    email: user.email,
    accessPressing: user.accessPressing,
    accessAtelier: user.accessAtelier,
    theme: user.theme,
  };

  const { accessToken, refreshToken: newRefreshToken } = await issueTokens(tokenUser);
  return res.json({ accessToken, refreshToken: newRefreshToken });
});

authRouter.post("/logout", async (req, res) => {
  const schema = z.object({ refreshToken: z.string().min(20) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const tokenHash = sha256(parsed.data.refreshToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!record) return res.status(204).send();

  if (!record.revokedAt) {
    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
  }

  return res.status(204).send();
});

// Inscription réservée (Super Admin) : utile pour créer un premier Admin/Employé.
authRouter.post(
  "/register",
  requireAuth,
  requireRoles("SUPER_ADMIN"),
  async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { prenom, nom, telephone, email, password, role, accessPressing, accessAtelier } = parsed.data;
    const normalizedTelephone = normalizeTelephone(telephone);
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedTelephone) return res.status(400).json({ error: "Numéro de téléphone invalide" });
    
    // Vérifier si le téléphone existe déjà
    const existsPhone = await prisma.user.findUnique({ where: { telephone: normalizedTelephone } });
    if (existsPhone) return res.status(409).json({ error: "Numéro de téléphone déjà utilisé" });
    
    // Vérifier si l'email existe déjà (si fourni)
    if (normalizedEmail) {
      const existsEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existsEmail) return res.status(409).json({ error: "Email déjà utilisé" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Par défaut, les admins et employés ont accès aux deux espaces
    // Le super_admin peut modifier ça après
    const defaultAccessPressing = role === "ADMIN" || role === "EMPLOYEE" ? true : accessPressing;
    const defaultAccessAtelier = role === "ADMIN" || role === "EMPLOYEE" ? true : accessAtelier;
    
    const user = await prisma.user.create({
      data: { 
        prenom, 
        nom, 
        telephone: normalizedTelephone, 
        email: normalizedEmail, 
        passwordHash, 
        role: role ?? "EMPLOYEE",
        accessPressing: defaultAccessPressing,
        accessAtelier: defaultAccessAtelier,
      },
      select: { 
        id: true, 
        prenom: true, 
        nom: true, 
        telephone: true, 
        email: true, 
        role: true,
        accessPressing: true,
        accessAtelier: true,
      },
    });

    return res.status(201).json({ user });
  }
);
