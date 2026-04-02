import { Router } from "express";
import { prisma } from "../../prisma/prismaClient";
import { requireAuth } from "../middlewares/auth.middleware";
import { OrderStatus, OrderType } from "@prisma/client";

export const dashboardRouter = Router();

// Get dashboard stats
dashboardRouter.get("/stats", requireAuth, async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalClients,
    totalOrders,
    todayOrders,
    pendingOrders,
    pressingOrders,
    coutureOrders,
    totalRevenue,
    todayRevenue,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: OrderStatus.en_cours } }),
    prisma.order.count({ where: { type: OrderType.pressing } }),
    prisma.order.count({ where: { type: OrderType.couture } }),
    prisma.order.aggregate({ _sum: { prixTotal: true } }),
    prisma.order.aggregate({ 
      where: { createdAt: { gte: today } },
      _sum: { prixTotal: true }
    }),
  ]);

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
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
dashboardRouter.get("/workspace", requireAuth, async (req, res) => {
  const workspace = typeof req.query.workspace === "string" ? req.query.workspace : "pressing"; // 'pressing' or 'atelier'

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orderType = workspace === "pressing" ? OrderType.pressing : OrderType.couture;

  const [
    totalOrders,
    pendingOrders,
    todayOrders,
    todayRevenue,
    services,
  ] = await Promise.all([
    prisma.order.count({ where: { type: orderType } }),
    prisma.order.count({ where: { type: orderType, status: OrderStatus.en_cours } }),
    prisma.order.count({ where: { type: orderType, createdAt: { gte: today } } }),
    prisma.order.aggregate({
      where: { type: orderType, createdAt: { gte: today } },
      _sum: { prixTotal: true },
    }),
    workspace === 'atelier' 
      ? prisma.coutureOrder.groupBy({
          by: ["typeService"],
          _count: { id: true },
        })
      : prisma.pressingOrder.groupBy({
          by: ["typeService"],
          _count: { id: true },
        }),
  ]);

  // Get recent orders for this workspace
  const recentOrders = await prisma.order.findMany({
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
