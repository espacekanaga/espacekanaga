import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import crypto from "crypto";

import { env } from "../../env";
import { prisma } from "../../prisma/prismaClient";
import type { UserRole } from "../../types/roles";
import { normalizeEmail, normalizeTelephone } from "../utils/normalize";

const loginSchema = z
  .object({
    telephone: z.string().min(8).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6),
  })
  .refine((value) => Boolean(value.telephone || value.email), {
    message: "Fournir un telephone ou un email",
    path: ["telephone"],
  });

const registerClientSchema = z.object({
  prenom: z.string().min(2),
  nom: z.string().min(2),
  telephone: z.string().min(8),
  email: z.string().email().optional(),
  adresse: z.string().optional(),
  password: z.string().min(6),
  clientType: z.enum(["pressing", "atelier", "both"]).default("both"),
});

interface TokenUser {
  id: string;
  role: UserRole;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  clientType?: "pressing" | "atelier" | "both" | null;
  accessPressing: boolean;
  accessAtelier: boolean;
  theme: string;
}

const authUserSelect = {
  id: true,
  prenom: true,
  nom: true,
  telephone: true,
  email: true,
  adresse: true,
  passwordHash: true,
  role: true,
  isActive: true,
  accessPressing: true,
  accessAtelier: true,
  theme: true,
  createdAt: true,
  updatedAt: true,
} as const;

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function parseExpiresInToDate(expiresIn: string) {
  const match = /^([0-9]+)([smhd])$/.exec(expiresIn.trim());
  if (!match) throw new Error("Invalid expiresIn format");

  const value = Number(match[1]);
  const unit = match[2];
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

function signAccessToken(user: TokenUser) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      prenom: user.prenom,
      nom: user.nom,
      telephone: user.telephone,
      email: user.email,
      clientType: user.clientType ?? undefined,
      accessPressing: user.accessPressing,
      accessAtelier: user.accessAtelier,
      theme: user.theme,
      typ: "access",
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );
}

function signRefreshToken(user: { id: string; role: UserRole }, jti: string) {
  return jwt.sign({ sub: user.id, role: user.role, typ: "refresh", jti }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

function resolveClientType(source: {
  accessPressing: boolean;
  accessAtelier: boolean;
  clientType?: "pressing" | "atelier" | "both" | null;
}) {
  if (source.clientType) return source.clientType;
  if (source.accessPressing && source.accessAtelier) return "both";
  if (source.accessAtelier) return "atelier";
  if (source.accessPressing) return "pressing";
  return null;
}

async function loadClientTypeByTelephone(telephone: string) {
  const client = await prisma.client.findUnique({
    where: { telephone },
    select: { clientType: true },
  });

  return client?.clientType ?? null;
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

function buildAuthUser(user: {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  adresse: string | null;
  role: UserRole;
  isActive: boolean;
  accessPressing: boolean;
  accessAtelier: boolean;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
  clientType?: "pressing" | "atelier" | "both" | null;
}) {
  return {
    id: user.id,
    prenom: user.prenom,
    nom: user.nom,
    telephone: user.telephone,
    email: user.email,
    adresse: user.adresse,
    role: user.role,
    isActive: user.isActive,
    clientType: resolveClientType(user),
    accessPressing: user.accessPressing,
    accessAtelier: user.accessAtelier,
    theme: user.theme,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const normalizedTelephone = normalizeTelephone(parsed.data.telephone);
  const normalizedEmail = normalizeEmail(parsed.data.email);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(normalizedTelephone ? [{ telephone: normalizedTelephone }] : []),
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ],
    },
    select: authUserSelect,
  });

  if (!user) return res.status(401).json({ error: "Identifiants invalides" });

  const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!isValidPassword) return res.status(401).json({ error: "Identifiants invalides" });
  if (!user.isActive) return res.status(403).json({ error: "Utilisateur desactive" });

  const clientType = await loadClientTypeByTelephone(user.telephone);

  const tokenUser: TokenUser = {
    id: user.id,
    role: user.role,
    prenom: user.prenom,
    nom: user.nom,
    telephone: user.telephone,
    email: user.email,
    clientType: clientType ?? resolveClientType(user),
    accessPressing: user.accessPressing,
    accessAtelier: user.accessAtelier,
    theme: user.theme,
  };

  const { accessToken, refreshToken } = await issueTokens(tokenUser);
  return res.json({
    accessToken,
    refreshToken,
    user: buildAuthUser(user),
  });
});

authRouter.post("/refresh", async (req, res) => {
  const schema = z.object({ refreshToken: z.string().min(20) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  let payload: any;
  try {
    payload = jwt.verify(parsed.data.refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ error: "Refresh token invalide" });
  }

  if (payload?.typ !== "refresh") return res.status(401).json({ error: "Refresh token invalide" });

  const tokenHash = sha256(parsed.data.refreshToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!record) return res.status(401).json({ error: "Refresh token invalide" });
  if (record.revokedAt) return res.status(401).json({ error: "Refresh token revoque" });
  if (record.expiresAt.getTime() <= Date.now()) return res.status(401).json({ error: "Refresh token expire" });

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: authUserSelect,
  });
  if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });
  if (!user.isActive) return res.status(403).json({ error: "Utilisateur desactive" });

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const clientType = await loadClientTypeByTelephone(user.telephone);

  const tokenUser: TokenUser = {
    id: user.id,
    role: user.role,
    prenom: user.prenom,
    nom: user.nom,
    telephone: user.telephone,
    email: user.email,
    clientType: clientType ?? resolveClientType(user),
    accessPressing: user.accessPressing,
    accessAtelier: user.accessAtelier,
    theme: user.theme,
  };

  const { accessToken, refreshToken } = await issueTokens(tokenUser);
  return res.json({ accessToken, refreshToken });
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

authRouter.post("/register", async (req, res) => {
  const parsed = registerClientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const normalizedTelephone = normalizeTelephone(parsed.data.telephone);
  const normalizedEmail = normalizeEmail(parsed.data.email);

  if (!normalizedTelephone) {
    return res.status(400).json({ error: "Numero de telephone invalide" });
  }

  const [existingUserByPhone, existingClientByPhone, existingUserByEmail, existingClientByEmail] = await Promise.all([
    prisma.user.findUnique({ where: { telephone: normalizedTelephone }, select: { id: true } }),
    prisma.client.findUnique({ where: { telephone: normalizedTelephone }, select: { id: true } }),
    normalizedEmail ? prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } }) : Promise.resolve(null),
    normalizedEmail ? prisma.client.findFirst({ where: { email: normalizedEmail }, select: { id: true } }) : Promise.resolve(null),
  ]);

  if (existingUserByPhone || existingClientByPhone) {
    return res.status(409).json({ error: "Numero de telephone deja utilise" });
  }

  if (existingUserByEmail || existingClientByEmail) {
    return res.status(409).json({ error: "Email deja utilise" });
  }

  const accessPressing = parsed.data.clientType === "pressing" || parsed.data.clientType === "both";
  const accessAtelier = parsed.data.clientType === "atelier" || parsed.data.clientType === "both";
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        prenom: parsed.data.prenom,
        nom: parsed.data.nom,
        telephone: normalizedTelephone,
        email: normalizedEmail,
        adresse: parsed.data.adresse,
        passwordHash,
        role: "CLIENT" as any,
        accessPressing,
        accessAtelier,
      },
      select: authUserSelect,
    });

    await tx.client.create({
      data: {
        prenom: parsed.data.prenom,
        nom: parsed.data.nom,
        telephone: normalizedTelephone,
        email: normalizedEmail,
        adresse: parsed.data.adresse,
        clientType: parsed.data.clientType,
      },
    });

    return createdUser;
  });

  const tokenUser: TokenUser = {
    id: user.id,
    role: user.role,
    prenom: user.prenom,
    nom: user.nom,
    telephone: user.telephone,
    email: user.email,
    clientType: parsed.data.clientType,
    accessPressing: user.accessPressing,
    accessAtelier: user.accessAtelier,
    theme: user.theme,
  };

  const { accessToken, refreshToken } = await issueTokens(tokenUser);

  return res.status(201).json({
    accessToken,
    refreshToken,
    user: buildAuthUser({ ...user, clientType: parsed.data.clientType }),
  });
});
