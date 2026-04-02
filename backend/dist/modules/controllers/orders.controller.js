"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prismaClient_1 = require("../../prisma/prismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const invoiceGenerator_1 = require("../../services/invoiceGenerator");
const orderSchema = zod_1.z.object({
    clientId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(["pressing", "couture"]),
    prixTotal: zod_1.z.number().min(0),
    pressing: zod_1.z.object({
        typeVetement: zod_1.z.string(),
        quantite: zod_1.z.number().min(1),
        typeService: zod_1.z.string(),
        instructions: zod_1.z.string().optional(),
    }).optional(),
    couture: zod_1.z.object({
        typeService: zod_1.z.enum(["sur_mesure", "retouche"]),
        description: zod_1.z.string().optional(),
        tissu: zod_1.z.string().optional(),
        deadline: zod_1.z.string().optional(),
        modelImage: zod_1.z.string().optional(), // Base64 or URL of the model image
    }).optional(),
});
exports.ordersRouter = (0, express_1.Router)();
function canModifyOrder(orderType, user) {
    if (!user)
        return false;
    if (user.role === "SUPER_ADMIN")
        return true;
    if (orderType === client_1.OrderType.pressing)
        return user.accessPressing === true;
    if (orderType === client_1.OrderType.couture)
        return user.accessAtelier === true;
    return false;
}
// Get all orders
exports.ordersRouter.get("/", auth_middleware_1.requireAuth, async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const limit = typeof req.query.limit === "string" ? req.query.limit : "50";
    const offset = typeof req.query.offset === "string" ? req.query.offset : "0";
    const type = typeof req.query.type === "string" ? req.query.type : undefined;
    const where = {};
    if (type) {
        where.type = type === "pressing" ? client_1.OrderType.pressing : client_1.OrderType.couture;
    }
    if (search) {
        where.client = {
            OR: [
                { prenom: { contains: search, mode: 'insensitive' } },
                { prenom: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                { nom: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
            ]
        };
    }
    const [orders, total] = await Promise.all([
        prismaClient_1.prisma.order.findMany({
            where,
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { createdAt: 'desc' },
            include: {
                client: { select: { id: true, prenom: true, nom: true, telephone: true } },
                pressing: true,
                couture: true,
                createdBy: { select: { id: true, prenom: true, nom: true, role: true } },
            },
        }),
        prismaClient_1.prisma.order.count({ where }),
    ]);
    res.json({ data: orders, total });
});
// Get orders by client ID
exports.ordersRouter.get("/client/:clientId", auth_middleware_1.requireAuth, async (req, res) => {
    const { clientId } = req.params;
    const orders = await prismaClient_1.prisma.order.findMany({
        where: { clientId: String(clientId) },
        orderBy: { createdAt: 'desc' },
        include: {
            client: { select: { id: true, prenom: true, nom: true, telephone: true } },
            pressing: true,
            couture: true,
            invoice: true,
            createdBy: { select: { id: true, prenom: true, nom: true, role: true } },
        },
    });
    res.json(orders);
});
// Get order by ID
exports.ordersRouter.get("/:id", auth_middleware_1.requireAuth, async (req, res) => {
    const order = await prismaClient_1.prisma.order.findUnique({
        where: { id: String(req.params.id) },
        include: {
            client: true,
            pressing: true,
            couture: true,
            invoice: true,
            createdBy: { select: { id: true, prenom: true, nom: true, role: true } },
            updatedBy: { select: { id: true, prenom: true, nom: true, role: true } },
        },
    });
    if (!order) {
        return res.status(404).json({ error: "Commande non trouvée" });
    }
    res.json(order);
});
// Create order
exports.ordersRouter.post("/", auth_middleware_1.requireAuth, async (req, res) => {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { clientId, type, prixTotal, pressing, couture } = parsed.data;
    // Check client exists
    const client = await prismaClient_1.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
        return res.status(404).json({ error: "Client non trouvé" });
    }
    const orderType = type === "pressing" ? client_1.OrderType.pressing : client_1.OrderType.couture;
    const actorId = req.user?.id;
    if (!actorId)
        return res.status(401).json({ error: "Non authentifié" });
    const order = await prismaClient_1.prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
            data: {
                clientId,
                type: orderType,
                prixTotal,
                status: client_1.OrderStatus.en_attente,
                createdById: actorId,
                updatedById: actorId,
            },
            include: {
                client: { select: { id: true, prenom: true, nom: true, telephone: true } },
            },
        });
        if (type === "pressing" && pressing) {
            await tx.pressingOrder.create({
                data: {
                    orderId: newOrder.id,
                    typeVetement: pressing.typeVetement,
                    quantite: pressing.quantite,
                    typeService: pressing.typeService,
                    instructions: pressing.instructions,
                },
            });
        }
        else if (type === "couture" && couture) {
            await tx.coutureOrder.create({
                data: {
                    orderId: newOrder.id,
                    typeService: couture.typeService,
                    description: couture.description,
                    tissu: couture.tissu,
                    deadline: couture.deadline ? new Date(couture.deadline) : null,
                    modelImage: couture.modelImage,
                },
            });
        }
        return newOrder;
    });
    res.status(201).json(order);
});
// Update order status
exports.ordersRouter.patch("/:id/status", auth_middleware_1.requireAuth, async (req, res) => {
    const schema = zod_1.z.object({ status: zod_1.z.enum(["EN_ATTENTE", "EN_COURS", "TERMINE", "ANNULE"]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const statusMap = {
        EN_ATTENTE: client_1.OrderStatus.en_attente,
        EN_COURS: client_1.OrderStatus.en_cours,
        TERMINE: client_1.OrderStatus.termine,
        ANNULE: client_1.OrderStatus.livre,
    };
    const existing = await prismaClient_1.prisma.order.findUnique({
        where: { id: String(req.params.id) },
        select: { id: true, type: true },
    });
    if (!existing)
        return res.status(404).json({ error: "Commande non trouvée" });
    if (!canModifyOrder(existing.type, req.user)) {
        return res.status(403).json({ error: "Accès refusé" });
    }
    const order = await prismaClient_1.prisma.order.update({
        where: { id: String(req.params.id) },
        data: {
            status: statusMap[parsed.data.status],
            updatedById: req.user?.id,
        },
    });
    res.json(order);
});
// Delete order
exports.ordersRouter.delete("/:id", auth_middleware_1.requireAuth, async (req, res) => {
    const existing = await prismaClient_1.prisma.order.findUnique({
        where: { id: String(req.params.id) },
        select: { id: true, type: true },
    });
    if (!existing)
        return res.status(404).json({ error: "Commande non trouvée" });
    if (!canModifyOrder(existing.type, req.user)) {
        return res.status(403).json({ error: "Accès refusé" });
    }
    await prismaClient_1.prisma.order.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
});
// Generate invoice for order
exports.ordersRouter.post("/:id/invoice", auth_middleware_1.requireAuth, async (req, res) => {
    const { id } = req.params;
    // Check if order exists
    const order = await prismaClient_1.prisma.order.findUnique({
        where: { id: String(id) },
        include: {
            client: true,
            pressing: true,
            couture: true,
            invoice: true,
            createdBy: { select: { prenom: true, nom: true } },
        },
    });
    if (!order) {
        return res.status(404).json({ error: "Commande non trouvée" });
    }
    if (!canModifyOrder(order.type, req.user)) {
        return res.status(403).json({ error: "Accès refusé" });
    }
    // Check if invoice already exists
    if (order.invoice) {
        return res.status(409).json({ error: "Une facture existe déjà pour cette commande" });
    }
    // Generate invoice number
    const invoiceCount = await prismaClient_1.prisma.invoice.count();
    const numero = `F-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;
    // Calculate amounts
    const montantHT = order.prixTotal / 1.18; // Assuming 18% VAT
    const montantTVA = order.prixTotal - montantHT;
    // Build invoice lines
    const lignes = [];
    if (order.pressing) {
        lignes.push({
            description: `Pressing - ${order.pressing.typeService} (${order.pressing.typeVetement})`,
            quantite: order.pressing.quantite,
            prixUnitaire: order.prixTotal / order.pressing.quantite,
            montant: order.prixTotal,
        });
    }
    else if (order.couture) {
        lignes.push({
            description: `Couture - ${order.couture.typeService === 'retouche' ? 'Retouche' : 'Sur mesure'}`,
            quantite: 1,
            prixUnitaire: order.prixTotal,
            montant: order.prixTotal,
        });
    }
    // Generate PDF invoice
    const pdfUrl = await invoiceGenerator_1.InvoiceGenerator.generateInvoicePDF({
        numero,
        date: new Date(),
        client: order.client,
        order: {
            id: order.id,
            type: order.type,
            status: order.status,
            prixTotal: order.prixTotal,
            createdAt: order.createdAt,
        },
        lignes,
        montantHT,
        tauxTVA: 18,
        montantTVA,
        montantTTC: order.prixTotal,
        createdBy: order.createdBy || undefined,
    });
    // Create invoice record with PDF URL
    const invoice = await prismaClient_1.prisma.invoice.create({
        data: {
            orderId: order.id,
            numero,
            montantHT,
            tauxTVA: 18,
            montantTVA,
            montantTTC: order.prixTotal,
            lignes,
            statut: 'emise',
            filePath: pdfUrl,
        },
    });
    res.status(201).json({
        message: "Facture générée avec succès",
        invoice,
        pdfUrl,
        downloadUrl: `${process.env.API_URL || 'http://localhost:4000'}${pdfUrl}`,
    });
});
