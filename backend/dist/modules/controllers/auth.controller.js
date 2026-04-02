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
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const normalize_1 = require("../utils/normalize");
const loginSchema = zod_1.z
    .object({
    telephone: zod_1.z.string().min(8).optional(),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(6),
})
    .refine((v) => Boolean(v.telephone || v.email), {
    message: "Fournir un téléphone ou un email",
    path: ["telephone"],
});
const registerSchema = zod_1.z.object({
    prenom: zod_1.z.string().min(2),
    nom: zod_1.z.string().min(2),
    telephone: zod_1.z.string().min(8),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(["SUPER_ADMIN", "ADMIN", "EMPLOYEE"]).optional(),
    accessPressing: zod_1.z.boolean().optional().default(false),
    accessAtelier: zod_1.z.boolean().optional().default(false),
});
function sha256(input) {
    return crypto_1.default.createHash("sha256").update(input).digest("hex");
}
function parseExpiresInToDate(expiresIn) {
    const m = /^([0-9]+)([smhd])$/.exec(expiresIn.trim());
    if (!m)
        throw new Error("Invalid expiresIn format");
    const value = Number(m[1]);
    const unit = m[2];
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
        accessPressing: user.accessPressing,
        accessAtelier: user.accessAtelier,
        theme: user.theme,
        typ: "access"
    }, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
}
function signRefreshToken(user, jti) {
    return jsonwebtoken_1.default.sign({ sub: user.id, role: user.role, typ: "refresh", jti }, env_1.env.JWT_REFRESH_SECRET, {
        expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
    });
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
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { telephone, email, password } = parsed.data;
    const normalizedTelephone = (0, normalize_1.normalizeTelephone)(telephone);
    const normalizedEmail = (0, normalize_1.normalizeEmail)(email);
    const user = await prismaClient_1.prisma.user.findFirst({
        where: {
            OR: [
                ...(normalizedTelephone ? [{ telephone: normalizedTelephone }] : []),
                ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            ],
        },
    });
    if (!user)
        return res.status(401).json({ error: "Identifiants invalides" });
    const ok = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ error: "Identifiants invalides" });
    if (!user.isActive)
        return res.status(403).json({ error: "Utilisateur désactivé" });
    const tokenUser = {
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
exports.authRouter.post("/refresh", async (req, res) => {
    const schema = zod_1.z.object({ refreshToken: zod_1.z.string().min(20) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { refreshToken } = parsed.data;
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
    }
    catch {
        return res.status(401).json({ error: "Refresh token invalide" });
    }
    if (payload?.typ !== "refresh")
        return res.status(401).json({ error: "Refresh token invalide" });
    const tokenHash = sha256(refreshToken);
    const record = await prismaClient_1.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record)
        return res.status(401).json({ error: "Refresh token invalide" });
    if (record.revokedAt)
        return res.status(401).json({ error: "Refresh token révoqué" });
    if (record.expiresAt.getTime() <= Date.now())
        return res.status(401).json({ error: "Refresh token expiré" });
    const user = await prismaClient_1.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user)
        return res.status(401).json({ error: "Utilisateur introuvable" });
    if (!user.isActive)
        return res.status(403).json({ error: "Utilisateur désactivé" });
    await prismaClient_1.prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
    });
    const tokenUser = {
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
// Inscription réservée (Super Admin) : utile pour créer un premier Admin/Employé.
exports.authRouter.post("/register", auth_middleware_1.requireAuth, (0, rbac_middleware_1.requireRoles)("SUPER_ADMIN"), async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { prenom, nom, telephone, email, password, role, accessPressing, accessAtelier } = parsed.data;
    const normalizedTelephone = (0, normalize_1.normalizeTelephone)(telephone);
    const normalizedEmail = (0, normalize_1.normalizeEmail)(email);
    if (!normalizedTelephone)
        return res.status(400).json({ error: "Numéro de téléphone invalide" });
    // Vérifier si le téléphone existe déjà
    const existsPhone = await prismaClient_1.prisma.user.findUnique({ where: { telephone: normalizedTelephone } });
    if (existsPhone)
        return res.status(409).json({ error: "Numéro de téléphone déjà utilisé" });
    // Vérifier si l'email existe déjà (si fourni)
    if (normalizedEmail) {
        const existsEmail = await prismaClient_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existsEmail)
            return res.status(409).json({ error: "Email déjà utilisé" });
    }
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    // Par défaut, les admins et employés ont accès aux deux espaces
    // Le super_admin peut modifier ça après
    const defaultAccessPressing = role === "ADMIN" || role === "EMPLOYEE" ? true : accessPressing;
    const defaultAccessAtelier = role === "ADMIN" || role === "EMPLOYEE" ? true : accessAtelier;
    const user = await prismaClient_1.prisma.user.create({
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
});
