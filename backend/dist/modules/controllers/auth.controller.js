"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../env");
const prismaClient_1 = require("../../prisma/prismaClient");
const normalize_1 = require("../utils/normalize");
const loginSchema = zod_1.z
    .object({
    telephone: zod_1.z.string().min(8).optional(),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(6),
})
    .refine((value) => Boolean(value.telephone || value.email), {
    message: "Fournir un telephone ou un email",
    path: ["telephone"],
});
const registerClientSchema = zod_1.z.object({
    prenom: zod_1.z.string().min(2),
    nom: zod_1.z.string().min(2),
    telephone: zod_1.z.string().min(8),
    email: zod_1.z.string().email().optional(),
    adresse: zod_1.z.string().optional(),
    password: zod_1.z.string().min(6),
    clientType: zod_1.z.enum(["pressing", "atelier", "both"]).default("both"),
});
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
};
function sha256(input) {
    return crypto_1.default.createHash("sha256").update(input).digest("hex");
}
function parseExpiresInToDate(expiresIn) {
    const match = /^([0-9]+)([smhd])$/.exec(expiresIn.trim());
    if (!match)
        throw new Error("Invalid expiresIn format");
    const value = Number(match[1]);
    const unit = match[2];
    const seconds = unit === "s"
        ? value
        : unit === "m"
            ? value * 60
            : unit === "h"
                ? value * 60 * 60
                : value * 60 * 60 * 24;
    return new Date(Date.now() + seconds * 1000);
}
function signAccessToken(user) {
    return jsonwebtoken_1.default.sign({
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
    }, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
}
function signRefreshToken(user, jti) {
    return jsonwebtoken_1.default.sign({ sub: user.id, role: user.role, typ: "refresh", jti }, env_1.env.JWT_REFRESH_SECRET, {
        expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
    });
}
function resolveClientType(source) {
    if (source.clientType)
        return source.clientType;
    if (source.accessPressing && source.accessAtelier)
        return "both";
    if (source.accessAtelier)
        return "atelier";
    if (source.accessPressing)
        return "pressing";
    return null;
}
async function loadClientTypeByTelephone(telephone) {
    const client = await prismaClient_1.prisma.client.findUnique({
        where: { telephone },
        select: { clientType: true },
    });
    return client?.clientType ?? null;
}
async function issueTokens(user) {
    const accessToken = signAccessToken(user);
    const jti = crypto_1.default.randomUUID();
    const refreshToken = signRefreshToken(user, jti);
    const tokenHash = sha256(refreshToken);
    const expiresAt = parseExpiresInToDate(env_1.env.JWT_REFRESH_EXPIRES_IN);
    await prismaClient_1.prisma.refreshToken.create({
        data: {
            userId: user.id,
            tokenHash,
            expiresAt,
        },
    });
    return { accessToken, refreshToken };
}
function buildAuthUser(user) {
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
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const normalizedTelephone = (0, normalize_1.normalizeTelephone)(parsed.data.telephone);
    const normalizedEmail = (0, normalize_1.normalizeEmail)(parsed.data.email);
    const user = await prismaClient_1.prisma.user.findFirst({
        where: {
            OR: [
                ...(normalizedTelephone ? [{ telephone: normalizedTelephone }] : []),
                ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            ],
        },
        select: authUserSelect,
    });
    if (!user)
        return res.status(401).json({ error: "Identifiants invalides" });
    const isValidPassword = await bcrypt_1.default.compare(parsed.data.password, user.passwordHash);
    if (!isValidPassword)
        return res.status(401).json({ error: "Identifiants invalides" });
    if (!user.isActive)
        return res.status(403).json({ error: "Utilisateur desactive" });
    const clientType = await loadClientTypeByTelephone(user.telephone);
    const tokenUser = {
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
exports.authRouter.post("/refresh", async (req, res) => {
    const schema = zod_1.z.object({ refreshToken: zod_1.z.string().min(20) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(parsed.data.refreshToken, env_1.env.JWT_REFRESH_SECRET);
    }
    catch {
        return res.status(401).json({ error: "Refresh token invalide" });
    }
    if (payload?.typ !== "refresh")
        return res.status(401).json({ error: "Refresh token invalide" });
    const tokenHash = sha256(parsed.data.refreshToken);
    const record = await prismaClient_1.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record)
        return res.status(401).json({ error: "Refresh token invalide" });
    if (record.revokedAt)
        return res.status(401).json({ error: "Refresh token revoque" });
    if (record.expiresAt.getTime() <= Date.now())
        return res.status(401).json({ error: "Refresh token expire" });
    const user = await prismaClient_1.prisma.user.findUnique({
        where: { id: payload.sub },
        select: authUserSelect,
    });
    if (!user)
        return res.status(401).json({ error: "Utilisateur introuvable" });
    if (!user.isActive)
        return res.status(403).json({ error: "Utilisateur desactive" });
    await prismaClient_1.prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
    });
    const clientType = await loadClientTypeByTelephone(user.telephone);
    const tokenUser = {
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
exports.authRouter.post("/logout", async (req, res) => {
    const schema = zod_1.z.object({ refreshToken: zod_1.z.string().min(20) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const tokenHash = sha256(parsed.data.refreshToken);
    const record = await prismaClient_1.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record)
        return res.status(204).send();
    if (!record.revokedAt) {
        await prismaClient_1.prisma.refreshToken.update({
            where: { id: record.id },
            data: { revokedAt: new Date() },
        });
    }
    return res.status(204).send();
});
exports.authRouter.post("/register", async (req, res) => {
    const parsed = registerClientSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const normalizedTelephone = (0, normalize_1.normalizeTelephone)(parsed.data.telephone);
    const normalizedEmail = (0, normalize_1.normalizeEmail)(parsed.data.email);
    if (!normalizedTelephone) {
        return res.status(400).json({ error: "Numero de telephone invalide" });
    }
    const [existingUserByPhone, existingClientByPhone, existingUserByEmail, existingClientByEmail] = await Promise.all([
        prismaClient_1.prisma.user.findUnique({ where: { telephone: normalizedTelephone }, select: { id: true } }),
        prismaClient_1.prisma.client.findUnique({ where: { telephone: normalizedTelephone }, select: { id: true } }),
        normalizedEmail ? prismaClient_1.prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } }) : Promise.resolve(null),
        normalizedEmail ? prismaClient_1.prisma.client.findFirst({ where: { email: normalizedEmail }, select: { id: true } }) : Promise.resolve(null),
    ]);
    if (existingUserByPhone || existingClientByPhone) {
        return res.status(409).json({ error: "Numero de telephone deja utilise" });
    }
    if (existingUserByEmail || existingClientByEmail) {
        return res.status(409).json({ error: "Email deja utilise" });
    }
    const accessPressing = parsed.data.clientType === "pressing" || parsed.data.clientType === "both";
    const accessAtelier = parsed.data.clientType === "atelier" || parsed.data.clientType === "both";
    const passwordHash = await bcrypt_1.default.hash(parsed.data.password, 10);
    const user = await prismaClient_1.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
            data: {
                prenom: parsed.data.prenom,
                nom: parsed.data.nom,
                telephone: normalizedTelephone,
                email: normalizedEmail,
                adresse: parsed.data.adresse,
                passwordHash,
                role: "CLIENT",
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
    const tokenUser = {
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
