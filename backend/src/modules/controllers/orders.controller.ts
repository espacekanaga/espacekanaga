import { Router, type Request } from "express";
import { z } from "zod";
import { OrderStatus, OrderType, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { requireAuth } from "../middlewares/auth.middleware";
import { InvoiceGenerator } from "../../services/invoiceGenerator";

const orderSchema = z.object({
  clientId: z.string().uuid(),
  type: z.enum(["pressing", "couture"]),
  prixTotal: z.number().min(0),
  pressing: z.object({
    typeVetement: z.string(),
    quantite: z.number().min(1),
    typeService: z.string(),
    instructions: z.string().optional(),
  }).optional(),
  couture: z.object({
    typeService: z.enum(["sur_mesure", "retouche"]),
    description: z.string().optional(),
    tissu: z.string().optional(),
    deadline: z.string().optional(),
    modelImage: z.string().optional(), // Base64 or URL of the model image
  }).optional(),
});

export const ordersRouter = Router();

function canModifyOrder(orderType: OrderType, user: Request["user"] | undefined) {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (orderType === OrderType.pressing) return user.accessPressing === true;
  if (orderType === OrderType.couture) return user.accessAtelier === true;
  return false;
}

// Get all orders
ordersRouter.get("/", requireAuth, async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const limit = typeof req.query.limit === "string" ? req.query.limit : "50";
  const offset = typeof req.query.offset === "string" ? req.query.offset : "0";
  const type = typeof req.query.type === "string" ? req.query.type : undefined;

  const where: Prisma.OrderWhereInput = {};

  if (type) {
    where.type = type === "pressing" ? OrderType.pressing : OrderType.couture;
  }

  if (search) {
    where.client = {
      OR: [
        { prenom: { contains: search as string, mode: 'insensitive' } },
        { prenom: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { nom: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ]
    };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, prenom: true, nom: true, telephone: true } },
        pressing: true,
        couture: true,
        createdBy: { select: { id: true, prenom: true, nom: true, role: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ data: orders, total });
});

// Get orders by client ID
ordersRouter.get("/client/:clientId", requireAuth, async (req, res) => {
  const { clientId } = req.params;
  
  const orders = await prisma.order.findMany({
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
ordersRouter.get("/:id", requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
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
ordersRouter.post("/", requireAuth, async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { clientId, type, prixTotal, pressing, couture } = parsed.data;

  // Check client exists
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return res.status(404).json({ error: "Client non trouvé" });
  }

  const orderType = type === "pressing" ? OrderType.pressing : OrderType.couture;
  const actorId = req.user?.id;
  if (!actorId) return res.status(401).json({ error: "Non authentifié" });

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        clientId,
        type: orderType,
        prixTotal,
        status: OrderStatus.en_attente,
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
    } else if (type === "couture" && couture) {
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
ordersRouter.patch("/:id/status", requireAuth, async (req, res) => {
  const schema = z.object({ status: z.enum(["EN_ATTENTE", "EN_COURS", "TERMINE", "ANNULE"]) });
  const parsed = schema.safeParse(req.body);
  
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const statusMap: Record<string, OrderStatus> = {
    EN_ATTENTE: OrderStatus.en_attente,
    EN_COURS: OrderStatus.en_cours,
    TERMINE: OrderStatus.termine,
    ANNULE: OrderStatus.livre,
  };

  const existing = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
    select: { id: true, type: true },
  });
  if (!existing) return res.status(404).json({ error: "Commande non trouvée" });

  if (!canModifyOrder(existing.type, req.user)) {
    return res.status(403).json({ error: "Accès refusé" });
  }

  const order = await prisma.order.update({
    where: { id: String(req.params.id) },
    data: {
      status: statusMap[parsed.data.status],
      updatedById: req.user?.id,
    },
  });

  res.json(order);
});

// Delete order
ordersRouter.delete("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
    select: { id: true, type: true },
  });
  if (!existing) return res.status(404).json({ error: "Commande non trouvée" });

  if (!canModifyOrder(existing.type, req.user)) {
    return res.status(403).json({ error: "Accès refusé" });
  }

  await prisma.order.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
});

// Generate invoice for order
ordersRouter.post("/:id/invoice", requireAuth, async (req, res) => {
  const { id } = req.params;
  
  // Check if order exists
  const order = await prisma.order.findUnique({
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
  const invoiceCount = await prisma.invoice.count();
  const numero = `F-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;
  
  // Calculate amounts
  const montantHT = order.prixTotal / 1.18; // Assuming 18% VAT
  const montantTVA = order.prixTotal - montantHT;
  
  // Build invoice lines
  const lignes: any[] = [];
  if (order.pressing) {
    lignes.push({
      description: `Pressing - ${order.pressing.typeService} (${order.pressing.typeVetement})`,
      quantite: order.pressing.quantite,
      prixUnitaire: order.prixTotal / order.pressing.quantite,
      montant: order.prixTotal,
    });
  } else if (order.couture) {
    lignes.push({
      description: `Couture - ${order.couture.typeService === 'retouche' ? 'Retouche' : 'Sur mesure'}`,
      quantite: 1,
      prixUnitaire: order.prixTotal,
      montant: order.prixTotal,
    });
  }
  
  // Generate PDF invoice
  const pdfUrl = await InvoiceGenerator.generateInvoicePDF({
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
  const invoice = await prisma.invoice.create({
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
