"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const prismaClient_1 = require("../../prisma/prismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
exports.dashboardRouter = (0, express_1.Router)();
// Get dashboard stats
exports.dashboardRouter.get("/stats", auth_middleware_1.requireAuth, async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalClients, totalOrders, todayOrders, pendingOrders, pressingOrders, coutureOrders, totalRevenue, todayRevenue,] = await Promise.all([
        prismaClient_1.prisma.client.count(),
        prismaClient_1.prisma.order.count(),
        prismaClient_1.prisma.order.count({ where: { createdAt: { gte: today } } }),
        prismaClient_1.prisma.order.count({ where: { status: client_1.OrderStatus.en_cours } }),
        prismaClient_1.prisma.order.count({ where: { type: client_1.OrderType.pressing } }),
        prismaClient_1.prisma.order.count({ where: { type: client_1.OrderType.couture } }),
        prismaClient_1.prisma.order.aggregate({ _sum: { prixTotal: true } }),
        prismaClient_1.prisma.order.aggregate({
            where: { createdAt: { gte: today } },
            _sum: { prixTotal: true }
        }),
    ]);
    // Get recent orders
    const recentOrders = await prismaClient_1.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            client: { select: { prenom: true, nom: true } },
        },
    });
    res.json({
        stats: {
            totalClients,
            totalOrders,
            todayOrders,
            pendingOrders,
            pressingOrders,
            coutureOrders,
            totalRevenue: totalRevenue._sum.prixTotal || 0,
            todayRevenue: todayRevenue._sum.prixTotal || 0,
        },
        recentOrders,
    });
});
// Get workspace-specific stats
exports.dashboardRouter.get("/workspace", auth_middleware_1.requireAuth, async (req, res) => {
    const workspace = typeof req.query.workspace === "string" ? req.query.workspace : "pressing"; // 'pressing' or 'atelier'
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderType = workspace === "pressing" ? client_1.OrderType.pressing : client_1.OrderType.couture;
    const [totalOrders, pendingOrders, todayOrders, todayRevenue, services,] = await Promise.all([
        prismaClient_1.prisma.order.count({ where: { type: orderType } }),
        prismaClient_1.prisma.order.count({ where: { type: orderType, status: client_1.OrderStatus.en_cours } }),
        prismaClient_1.prisma.order.count({ where: { type: orderType, createdAt: { gte: today } } }),
        prismaClient_1.prisma.order.aggregate({
            where: { type: orderType, createdAt: { gte: today } },
            _sum: { prixTotal: true },
        }),
        workspace === 'atelier'
            ? prismaClient_1.prisma.coutureOrder.groupBy({
                by: ["typeService"],
                _count: { id: true },
            })
            : prismaClient_1.prisma.pressingOrder.groupBy({
                by: ["typeService"],
                _count: { id: true },
            }),
    ]);
    // Get recent orders for this workspace
    const recentOrders = await prismaClient_1.prisma.order.findMany({
        where: { type: orderType },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            client: { select: { prenom: true, nom: true } },
            pressing: workspace === "pressing",
            couture: workspace === "atelier",
        },
    });
    res.json({
        stats: {
            totalOrders,
            pendingOrders,
            todayOrders,
            todayRevenue: todayRevenue._sum.prixTotal || 0,
            services,
        },
        recentOrders,
    });
});
