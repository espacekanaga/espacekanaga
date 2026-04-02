"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoicesRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prismaClient_1 = require("../../prisma/prismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
function canAccessByOrderType(orderType, user) {
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
exports.invoicesRouter = (0, express_1.Router)();
// List invoices
exports.invoicesRouter.get("/", auth_middleware_1.requireAuth, async (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: "Non authentifié" });
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const limit = typeof req.query.limit === "string" ? req.query.limit : "50";
    const offset = typeof req.query.offset === "string" ? req.query.offset : "0";
    const baseWhere = {};
    if (search) {
        baseWhere.OR = [
            { numero: { contains: search, mode: "insensitive" } },
            {
                order: {
                    client: {
                        OR: [
                            { prenom: { contains: search, mode: "insensitive" } },
                            { nom: { contains: search, mode: "insensitive" } },
                            { telephone: { contains: search, mode: "insensitive" } },
                        ],
                    },
                },
            },
        ];
    }
    const allowedTypes = [];
    if (user.role === "SUPER_ADMIN") {
        allowedTypes.push(client_1.OrderType.pressing, client_1.OrderType.couture);
    }
    else {
        if (user.accessPressing)
            allowedTypes.push(client_1.OrderType.pressing);
        if (user.accessAtelier)
            allowedTypes.push(client_1.OrderType.couture);
    }
    if (allowedTypes.length === 0) {
        return res.json({ data: [], total: 0 });
    }
    const where = {
        AND: [baseWhere, { order: { type: { in: allowedTypes } } }],
    };
    const [invoices, total] = await Promise.all([
        prismaClient_1.prisma.invoice.findMany({
            where,
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { createdAt: "desc" },
            include: {
                order: {
                    select: {
                        id: true,
                        type: true,
                        prixTotal: true,
                        createdAt: true,
                        client: { select: { id: true, prenom: true, nom: true, telephone: true } },
                    },
                },
            },
        }),
        prismaClient_1.prisma.invoice.count({ where }),
    ]);
    res.json({
        data: invoices.map((inv) => ({
            ...inv,
            downloadUrl: `${req.protocol}://${req.get("host")}${inv.filePath ?? ""}`,
        })),
        total,
    });
});
// Get invoice by id
exports.invoicesRouter.get("/:id", auth_middleware_1.requireAuth, async (req, res) => {
    const invoice = await prismaClient_1.prisma.invoice.findUnique({
        where: { id: String(req.params.id) },
        include: {
            order: {
                include: {
                    client: true,
                    pressing: true,
                    couture: true,
                    createdBy: { select: { id: true, prenom: true, nom: true, role: true } },
                },
            },
        },
    });
    if (!invoice)
        return res.status(404).json({ error: "Facture non trouvée" });
    if (!canAccessByOrderType(invoice.order.type, req.user)) {
        return res.status(403).json({ error: "Accès refusé" });
    }
    return res.json({
        ...invoice,
        downloadUrl: `${req.protocol}://${req.get("host")}${invoice.filePath ?? ""}`,
    });
});
