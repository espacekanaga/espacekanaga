"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prismaClient_1 = require("../../prisma/prismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const normalize_1 = require("../utils/normalize");
const createUserSchema = zod_1.z.object({
    prenom: zod_1.z.string().min(2),
    nom: zod_1.z.string().min(2),
    telephone: zod_1.z.string().min(8),
    email: zod_1.z.string().email().optional(),
    adresse: zod_1.z.string().optional(),
    role: zod_1.z.enum(["SUPER_ADMIN", "ADMIN", "EMPLOYEE"]).default("EMPLOYEE"),
    accessPressing: zod_1.z.boolean().default(false),
    accessAtelier: zod_1.z.boolean().default(false),
    password: zod_1.z.string().min(6),
});
const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
    isActive: zod_1.z.boolean().optional(),
});
const updateProfileSchema = zod_1.z.object({
    prenom: zod_1.z.string().min(2).optional(),
    nom: zod_1.z.string().min(2).optional(),
    telephone: zod_1.z.string().min(8).optional(),
    email: zod_1.z.string().email().optional().nullable(),
    adresse: zod_1.z.string().optional(),
    theme: zod_1.z.enum(["dark", "light", "system"]).optional(),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(6),
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
};
function forbidClientRole(req, res) {
    if (req.user?.role === "CLIENT") {
        res.status(403).json({ error: "Acces refuse" });
        return true;
    }
    return false;
}
exports.usersRouter = (0, express_1.Router)();
exports.usersRouter.get("/me", auth_middleware_1.requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Non authentifie" });
        }
        const user = await prismaClient_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: userSelect,
        });
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouve" });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Error fetching current user:", error);
        res.status(500).json({ error: "Erreur lors de la recuperation du profil" });
    }
});
exports.usersRouter.patch("/me", auth_middleware_1.requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Non authentifie" });
        }
        const parsed = updateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        let telephoneToSet;
        if (parsed.data.telephone !== undefined) {
            const normalized = (0, normalize_1.normalizeTelephone)(parsed.data.telephone);
            if (!normalized)
                return res.status(400).json({ error: "Numero de telephone invalide" });
            telephoneToSet = normalized;
        }
        const emailToSet = parsed.data.email !== undefined ? (0, normalize_1.normalizeEmail)(parsed.data.email) : undefined;
        if (telephoneToSet && telephoneToSet !== req.user.telephone) {
            const existingPhone = await prismaClient_1.prisma.user.findUnique({ where: { telephone: telephoneToSet }, select: { id: true } });
            if (existingPhone) {
                return res.status(409).json({ error: "Numero de telephone deja utilise" });
            }
        }
        if (parsed.data.email !== undefined && emailToSet !== req.user.email) {
            if (emailToSet) {
                const existingEmail = await prismaClient_1.prisma.user.findUnique({ where: { email: emailToSet }, select: { id: true } });
                if (existingEmail) {
                    return res.status(409).json({ error: "Email deja utilise" });
                }
            }
        }
        const updatedUser = await prismaClient_1.prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...parsed.data,
                ...(telephoneToSet !== undefined ? { telephone: telephoneToSet } : {}),
                ...(parsed.data.email !== undefined ? { email: emailToSet } : {}),
            },
            select: userSelect,
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Erreur lors de la mise a jour du profil" });
    }
});
exports.usersRouter.patch("/me/password", auth_middleware_1.requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Non authentifie" });
        }
        const parsed = changePasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        const user = await prismaClient_1.prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, passwordHash: true } });
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouve" });
        }
        const bcrypt = await import("bcrypt");
        const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: "Mot de passe actuel incorrect" });
        }
        const newPasswordHash = await bcrypt.hash(parsed.data.newPassword, 10);
        await prismaClient_1.prisma.user.update({
            where: { id: req.user.id },
            data: { passwordHash: newPasswordHash },
            select: { id: true },
        });
        res.json({ message: "Mot de passe change avec succes" });
    }
    catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ error: "Erreur lors du changement de mot de passe" });
    }
});
exports.usersRouter.get("/", auth_middleware_1.requireAuth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Non authentifie" });
        }
        if (forbidClientRole(req, res))
            return;
        let whereClause = {};
        if (req.user.role === "EMPLOYEE") {
            whereClause = { role: "EMPLOYEE" };
        }
        else if (req.user.role === "ADMIN") {
            whereClause = { role: { in: ["EMPLOYEE", "ADMIN"] } };
        }
        const users = await prismaClient_1.prisma.user.findMany({
            where: whereClause,
            select: userSelect,
            orderBy: { createdAt: "desc" },
        });
        res.json({ data: users, total: users.length });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Erreur lors de la recuperation des utilisateurs" });
    }
});
exports.usersRouter.get("/:id", auth_middleware_1.requireAuth, async (req, res) => {
    try {
        if (forbidClientRole(req, res))
            return;
        const user = await prismaClient_1.prisma.user.findUnique({
            where: { id: String(req.params.id) },
            select: userSelect,
        });
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouve" });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Erreur lors de la recuperation de l'utilisateur" });
    }
});
exports.usersRouter.post("/", auth_middleware_1.requireSuperAdmin, async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const normalizedTelephone = (0, normalize_1.normalizeTelephone)(parsed.data.telephone);
    const normalizedEmail = (0, normalize_1.normalizeEmail)(parsed.data.email);
    if (!normalizedTelephone)
        return res.status(400).json({ error: "Numero de telephone invalide" });
    const existingPhone = await prismaClient_1.prisma.user.findUnique({ where: { telephone: normalizedTelephone }, select: { id: true } });
    if (existingPhone) {
        return res.status(409).json({ error: "Numero de telephone deja utilise" });
    }
    if (normalizedEmail) {
        const existingEmail = await prismaClient_1.prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
        if (existingEmail) {
            return res.status(409).json({ error: "Email deja utilise" });
        }
    }
    const bcrypt = await import("bcrypt");
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await prismaClient_1.prisma.user.create({
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
exports.usersRouter.patch("/:id", auth_middleware_1.requireSuperAdmin, async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        let telephoneToSet;
        if (parsed.data.telephone !== undefined) {
            const normalized = (0, normalize_1.normalizeTelephone)(parsed.data.telephone);
            if (!normalized) {
                return res.status(400).json({ error: "Numero de telephone invalide" });
            }
            telephoneToSet = normalized;
        }
        const emailToSet = parsed.data.email !== undefined ? (0, normalize_1.normalizeEmail)(parsed.data.email) : undefined;
        const user = await prismaClient_1.prisma.user.update({
            where: { id: String(req.params.id) },
            data: {
                ...parsed.data,
                ...(telephoneToSet !== undefined ? { telephone: telephoneToSet } : {}),
                ...(parsed.data.email !== undefined ? { email: emailToSet } : {}),
            },
            select: userSelect,
        });
        res.json(user);
    }
    catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Erreur lors de la mise a jour de l'utilisateur" });
    }
});
exports.usersRouter.delete("/:id", auth_middleware_1.requireSuperAdmin, async (req, res) => {
    try {
        await prismaClient_1.prisma.user.delete({ where: { id: String(req.params.id) } });
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
    }
});
