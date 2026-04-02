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
const updateUserSchema = createUserSchema.partial().omit({ password: true });
// Schema for updating own profile (no role/permissions change allowed)
const updateProfileSchema = zod_1.z.object({
    prenom: zod_1.z.string().min(2).optional(),
    nom: zod_1.z.string().min(2).optional(),
    telephone: zod_1.z.string().min(8).optional(),
    email: zod_1.z.string().email().optional().nullable(),
    adresse: zod_1.z.string().optional(),
    theme: zod_1.z.enum(["dark", "light", "system"]).optional(),
});
// Schema for password change
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(6),
});
exports.usersRouter = (0, express_1.Router)();
// Get current user profile - requires authentication (MUST be before /:id route)
exports.usersRouter.get("/me", auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            return res.status(401).json({ error: "Non authentifié" });
        }
        const user = await prismaClient_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.error("Error fetching current user:", error);
        res.status(500).json({ error: "Erreur lors de la récupération du profil" });
    }
});
// Update current user profile - requires authentication (MUST be before /:id route)
exports.usersRouter.patch("/me", auth_middleware_1.requireAuth, async (req, res) => {
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
        let telephoneToSet;
        if (telephone !== undefined) {
            const normalized = (0, normalize_1.normalizeTelephone)(telephone);
            if (!normalized)
                return res.status(400).json({ error: "Numéro de téléphone invalide" });
            telephoneToSet = normalized;
        }
        const emailToSet = email !== undefined ? (0, normalize_1.normalizeEmail)(email) : undefined;
        // Check if phone already exists (if changing phone)
        if (telephoneToSet && telephoneToSet !== currentUser.telephone) {
            const existingPhone = await prismaClient_1.prisma.user.findUnique({ where: { telephone: telephoneToSet } });
            if (existingPhone) {
                return res.status(409).json({ error: "Numéro de téléphone déjà utilisé" });
            }
        }
        // Check if email already exists (if changing email)
        if (email !== undefined && emailToSet !== currentUser.email) {
            if (emailToSet) {
                const existingEmail = await prismaClient_1.prisma.user.findUnique({ where: { email: emailToSet } });
                if (existingEmail) {
                    return res.status(409).json({ error: "Email déjà utilisé" });
                }
            }
        }
        const updatedUser = await prismaClient_1.prisma.user.update({
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
    }
    catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
    }
});
// Change current user password - requires authentication (MUST be before /:id route)
exports.usersRouter.patch("/me/password", auth_middleware_1.requireAuth, async (req, res) => {
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
        const user = await prismaClient_1.prisma.user.findUnique({
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
        await prismaClient_1.prisma.user.update({
            where: { id: currentUser.id },
            data: { passwordHash: newPasswordHash },
        });
        res.json({ message: "Mot de passe changé avec succès" });
    }
    catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ error: "Erreur lors du changement de mot de passe" });
    }
});
// Get all users - requires authentication
exports.usersRouter.get("/", auth_middleware_1.requireAuth, async (req, res) => {
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
        }
        else if (currentUser.role === 'ADMIN') {
            // Admins can see employees and other admins (not super admins)
            whereClause = { role: { in: ['EMPLOYEE', 'ADMIN'] } };
        }
        // Super admins can see everyone (no filtering)
        const users = await prismaClient_1.prisma.user.findMany({
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
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
    }
});
// Get user by ID - requires authentication
exports.usersRouter.get("/:id", auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const user = await prismaClient_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Erreur lors de la récupération de l'utilisateur" });
    }
});
// Create user - requires super admin
exports.usersRouter.post("/", auth_middleware_1.requireSuperAdmin, async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { prenom, nom, telephone, email, adresse, role, accessPressing, accessAtelier, password } = parsed.data;
    const normalizedTelephone = (0, normalize_1.normalizeTelephone)(telephone);
    const normalizedEmail = (0, normalize_1.normalizeEmail)(email);
    if (!normalizedTelephone)
        return res.status(400).json({ error: "NumÃ©ro de tÃ©lÃ©phone invalide" });
    // Check if phone already exists
    const existingPhone = await prismaClient_1.prisma.user.findUnique({ where: { telephone: normalizedTelephone } });
    if (existingPhone) {
        return res.status(409).json({ error: "Numéro de téléphone déjà utilisé" });
    }
    // Check if email already exists (if provided)
    if (normalizedEmail) {
        const existingEmail = await prismaClient_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingEmail) {
            return res.status(409).json({ error: "Email déjà utilisé" });
        }
    }
    // Hash password
    const bcrypt = await import("bcrypt");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prismaClient_1.prisma.user.create({
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
                return res.status(400).json({ error: "NumÃ©ro de tÃ©lÃ©phone invalide" });
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
    }
    catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
    }
});
// Delete user - requires super admin
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
