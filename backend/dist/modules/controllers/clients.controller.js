"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prismaClient_1 = require("../../prisma/prismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const clientSchema = zod_1.z.object({
    prenom: zod_1.z.string().min(2),
    nom: zod_1.z.string().min(2),
    telephone: zod_1.z.string().min(8),
    email: zod_1.z.string().email().optional(),
    adresse: zod_1.z.string().optional(),
    clientType: zod_1.z.enum(['pressing', 'atelier', 'both']).default('both'),
    notes: zod_1.z.string().optional(),
});
exports.clientsRouter = (0, express_1.Router)();
// Get all clients with search and filter by type
exports.clientsRouter.get("/", auth_middleware_1.requireAuth, async (req, res) => {
    const { search, limit = "50", offset = "0", type } = req.query;
    const where = {};
    // Build search condition
    let searchCondition = null;
    if (search) {
        searchCondition = {
            OR: [
                { prenom: { contains: search, mode: 'insensitive' } },
                { nom: { contains: search, mode: 'insensitive' } },
                { telephone: { contains: search } },
            ],
        };
    }
    // Build type condition (include both)
    let typeCondition = null;
    if (type && type !== 'all') {
        typeCondition = {
            OR: [
                { clientType: type },
                { clientType: 'both' }
            ],
        };
    }
    // Combine conditions with AND if both exist
    if (searchCondition && typeCondition) {
        where.AND = [searchCondition, typeCondition];
    }
    else if (searchCondition) {
        where.OR = searchCondition.OR;
    }
    else if (typeCondition) {
        where.OR = typeCondition.OR;
    }
    // Build orderBy: prioritize the selected type first, then 'both'
    const orderBy = [];
    if (type === 'atelier') {
        // atelier comes before both alphabetically (a < b)
        orderBy.push({ clientType: 'asc' });
    }
    else if (type === 'pressing') {
        // pressing comes after both alphabetically (p > b), so use desc
        orderBy.push({ clientType: 'desc' });
    }
    orderBy.push({ createdAt: 'desc' });
    const [clients, total] = await Promise.all([
        prismaClient_1.prisma.client.findMany({
            where,
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy,
        }),
        prismaClient_1.prisma.client.count({ where }),
    ]);
    res.json({ data: clients, total });
});
// Get client by ID
exports.clientsRouter.get("/:id", auth_middleware_1.requireAuth, async (req, res) => {
    const client = await prismaClient_1.prisma.client.findUnique({
        where: { id: String(req.params.id) },
        include: {
            measurements: true,
            orders: {
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
        },
    });
    if (!client) {
        return res.status(404).json({ error: "Client non trouvé" });
    }
    res.json(client);
});
// Create client with measurements
exports.clientsRouter.post("/", auth_middleware_1.requireAuth, async (req, res) => {
    console.log("[DEBUG] Creating client with body:", JSON.stringify(req.body, null, 2));
    const parsed = clientSchema.safeParse(req.body);
    if (!parsed.success) {
        console.log("[DEBUG] Validation error:", parsed.error.flatten());
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { prenom, nom, telephone, adresse, notes, clientType } = parsed.data;
    const measurements = req.body.measurements;
    console.log("[DEBUG] Parsed data:", { prenom, nom, telephone, clientType });
    console.log("[DEBUG] Measurements received:", measurements);
    // Check if phone already exists
    const existing = await prismaClient_1.prisma.client.findUnique({ where: { telephone } });
    if (existing) {
        return res.status(409).json({ error: "Numéro de téléphone déjà utilisé" });
    }
    // Create client with measurements if provided
    const createData = {
        prenom,
        nom,
        telephone,
        adresse,
        notes,
        clientType: clientType || 'both',
    };
    // Only add measurements if they exist and have data
    if (measurements && Object.keys(measurements).length > 0) {
        createData.measurements = {
            create: {
                data: measurements,
            },
        };
        console.log("[DEBUG] Adding measurements to create data");
    }
    console.log("[DEBUG] Final create data:", JSON.stringify(createData, null, 2));
    const client = await prismaClient_1.prisma.client.create({
        data: createData,
        include: {
            measurements: true,
        },
    });
    console.log("[DEBUG] Client created:", JSON.stringify(client, null, 2));
    res.status(201).json(client);
});
// Update client
exports.clientsRouter.patch("/:id", auth_middleware_1.requireAuth, async (req, res) => {
    const parsed = clientSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const client = await prismaClient_1.prisma.client.update({
        where: { id: String(req.params.id) },
        data: parsed.data,
    });
    res.json(client);
});
// Delete client
exports.clientsRouter.delete("/:id", auth_middleware_1.requireAuth, async (req, res) => {
    await prismaClient_1.prisma.client.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
});
