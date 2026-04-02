"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.measurementsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prismaClient_1 = require("../../prisma/prismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const measurementSchema = zod_1.z.object({
    clientId: zod_1.z.string().uuid(),
    orderId: zod_1.z.string().uuid().optional(),
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
    notes: zod_1.z.string().optional(),
});
exports.measurementsRouter = (0, express_1.Router)();
// Get all measurements
exports.measurementsRouter.get("/", auth_middleware_1.requireAuth, async (req, res) => {
    const { clientId, limit = "50" } = req.query;
    const where = {};
    if (clientId) {
        where.clientId = String(clientId);
    }
    const measurements = await prismaClient_1.prisma.measurement.findMany({
        where,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
            client: { select: { id: true, prenom: true, nom: true, telephone: true } },
            order: { select: { id: true, type: true, status: true } },
        },
    });
    res.json(measurements);
});
// Get measurements by client ID
exports.measurementsRouter.get("/client/:clientId", auth_middleware_1.requireAuth, async (req, res) => {
    const { clientId } = req.params;
    const measurements = await prismaClient_1.prisma.measurement.findMany({
        where: { clientId: String(clientId) },
        orderBy: { createdAt: "desc" },
        include: {
            client: { select: { id: true, prenom: true, nom: true, telephone: true } },
            order: { select: { id: true, type: true, status: true } },
        },
    });
    res.json(measurements);
});
// Get measurement by ID
exports.measurementsRouter.get("/:id", auth_middleware_1.requireAuth, async (req, res) => {
    const measurement = await prismaClient_1.prisma.measurement.findUnique({
        where: { id: String(req.params.id) },
        include: {
            client: { select: { id: true, prenom: true, nom: true, telephone: true } },
            order: { select: { id: true, type: true, status: true } },
        },
    });
    if (!measurement) {
        return res.status(404).json({ error: "Mensuration non trouvée" });
    }
    res.json(measurement);
});
// Create measurement
exports.measurementsRouter.post("/", auth_middleware_1.requireAuth, async (req, res) => {
    const parsed = measurementSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { clientId, orderId, data, notes } = parsed.data;
    // Check client exists
    const client = await prismaClient_1.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
        return res.status(404).json({ error: "Client non trouvé" });
    }
    const measurement = await prismaClient_1.prisma.measurement.create({
        data: {
            clientId,
            orderId,
            data: data,
            notes,
        },
        include: {
            client: { select: { id: true, prenom: true, nom: true, telephone: true } },
            order: { select: { id: true, type: true, status: true } },
        },
    });
    res.status(201).json(measurement);
});
// Update measurement
exports.measurementsRouter.patch("/:id", auth_middleware_1.requireAuth, async (req, res) => {
    const parsed = measurementSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const measurement = await prismaClient_1.prisma.measurement.update({
        where: { id: String(req.params.id) },
        data: {
            ...parsed.data,
            data: parsed.data.data,
        },
        include: {
            client: { select: { id: true, prenom: true, nom: true, telephone: true } },
            order: { select: { id: true, type: true, status: true } },
        },
    });
    res.json(measurement);
});
// Delete measurement
exports.measurementsRouter.delete("/:id", auth_middleware_1.requireAuth, async (req, res) => {
    await prismaClient_1.prisma.measurement.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
});
