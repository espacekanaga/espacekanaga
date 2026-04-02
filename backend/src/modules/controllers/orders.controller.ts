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

type InvoiceScope = "global" | "pressing" | "atelier";

function defaultGlobalInvoiceSettings() {
  const companyName = process.env.INVOICE_COMPANY_NAME || "ESPACE KANAGA";
  const companyTagline = process.env.INVOICE_COMPANY_TAGLINE || "Pressing & Couture";
  const companyAddress = process.env.INVOICE_COMPANY_ADDRESS || "";
  const companyPhone = process.env.INVOICE_COMPANY_PHONE || "";
  const companyEmail = process.env.INVOICE_COMPANY_EMAIL || "espacekanaga@gmail.com";
  const companyNIF = process.env.INVOICE_COMPANY_NIF || "";
  const companyRCCM = process.env.INVOICE_COMPANY_RCCM || "";

  return {
    companyName,
    companyTagline,
    companyAddress,
    companyPhone,
    companyEmail,
    companyNIF,
    companyRCCM,
    stampEnabled: true,
    stampLine1: companyName,
    stampLine2: companyTagline.toUpperCase(),
    stampLine3: "VALIDÉ",
    stampColor: "#c41e3a",
    footerLine1:
      "Document généré numériquement - Cachet et signature électroniques certifiés",
    footerLine2:
      companyNIF || companyRCCM ? `NIF: ${companyNIF || "-"} • RCCM: ${companyRCCM || "-"}` : "",
  };
}

async function getOrCreateInvoiceSettings(scope: InvoiceScope) {
  const existing = await prisma.invoiceSettings.findUnique({ where: { scope } });
  if (existing) return existing;

  if (scope === "global") {
    return prisma.invoiceSettings.create({
      data: { scope, ...defaultGlobalInvoiceSettings() },
    });
  }

  return prisma.invoiceSettings.create({
    data: { scope, tauxTVA: 18, notes: "" },
  });
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
  const schema = z.object({
    status: z.union([
      z.enum(["en_attente", "en_cours", "termine", "livre"]),
      z.enum(["EN_ATTENTE", "EN_COURS", "TERMINE", "LIVRE"]),
    ]),
  });
  const parsed = schema.safeParse(req.body);
  
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const statusMap: Record<string, OrderStatus> = {
    en_attente: OrderStatus.en_attente,
    en_cours: OrderStatus.en_cours,
    termine: OrderStatus.termine,
    livre: OrderStatus.livre,
  };

  const normalizedStatus = parsed.data.status.toLowerCase();
  const nextStatus = statusMap[normalizedStatus];
  if (!nextStatus) {
    return res.status(400).json({ error: "Statut invalide" });
  }

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
      status: nextStatus,
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

  const settingsSchema = z.object({
    tauxTVA: z.coerce.number().min(0).max(100).optional(),
    notes: z.string().max(2000).optional(),
  });
  const settings = settingsSchema.safeParse(req.body ?? {});
  if (!settings.success) {
    return res.status(400).json({ error: settings.error.flatten() });
  }
  const overrideTauxTVA = settings.data.tauxTVA;
  const overrideNotes = settings.data.notes;
  
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

  const workspaceScope: InvoiceScope = order.type === OrderType.pressing ? "pressing" : "atelier";
  const [globalInvoiceSettings, workspaceInvoiceSettings] = await Promise.all([
    getOrCreateInvoiceSettings("global"),
    getOrCreateInvoiceSettings(workspaceScope),
  ]);

  const tauxTVA = overrideTauxTVA ?? workspaceInvoiceSettings.tauxTVA ?? 18;
  const notes = overrideNotes ?? (workspaceInvoiceSettings.notes || undefined);

  const existingInvoice = order.invoice;

  // Generate invoice number (keep same number if invoice already exists)
  let numero = existingInvoice?.numero;
  if (!numero) {
    const invoiceCount = await prisma.invoice.count();
    numero = `F-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;
  }
  
  // Calculate amounts
  const divisor = 1 + tauxTVA / 100;
  const montantHT = divisor === 0 ? order.prixTotal : order.prixTotal / divisor;
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
  
  const buildPdf = async (invoiceNumero: string) => {
    return InvoiceGenerator.generateInvoicePDF({
      numero: invoiceNumero,
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
      tauxTVA,
      montantTVA,
      montantTTC: order.prixTotal,
      createdBy: order.createdBy || undefined,
      notes,
      config: {
        company: {
          name: globalInvoiceSettings.companyName || undefined,
          tagline: globalInvoiceSettings.companyTagline || undefined,
          address: globalInvoiceSettings.companyAddress || undefined,
          phone: globalInvoiceSettings.companyPhone || undefined,
          email: globalInvoiceSettings.companyEmail || undefined,
          nif: globalInvoiceSettings.companyNIF || undefined,
          rccm: globalInvoiceSettings.companyRCCM || undefined,
        },
        stamp: {
          enabled: globalInvoiceSettings.stampEnabled,
          color: globalInvoiceSettings.stampColor || undefined,
          lines: [
            globalInvoiceSettings.stampLine1,
            globalInvoiceSettings.stampLine2,
            globalInvoiceSettings.stampLine3,
          ].filter(Boolean) as string[],
        },
        footer: {
          line1: globalInvoiceSettings.footerLine1 || undefined,
          line2: globalInvoiceSettings.footerLine2 || undefined,
        },
      },
    });
  };

  let pdfUrl = await buildPdf(numero);
  
  let invoiceAlreadyExists = !!existingInvoice;
  let invoice = existingInvoice
    ? await prisma.invoice.update({
        where: { id: existingInvoice.id },
        data: {
          montantHT,
          tauxTVA,
          montantTVA,
          montantTTC: order.prixTotal,
          lignes,
          filePath: pdfUrl,
          notes: notes ?? null,
        },
      })
    : null;

  if (!invoice) {
    const createData = {
      orderId: order.id,
      numero,
      montantHT,
      tauxTVA,
      montantTVA,
      montantTTC: order.prixTotal,
      lignes,
      statut: "emise" as const,
      filePath: pdfUrl,
      notes: notes ?? null,
    };

    try {
      invoice = await prisma.invoice.create({ data: createData });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = (err.meta as any)?.target;
        const targets = Array.isArray(target) ? target : typeof target === "string" ? [target] : [];

        if (targets.includes("orderId")) {
          const current = await prisma.invoice.findUnique({ where: { orderId: order.id } });
          if (!current) throw err;

          invoiceAlreadyExists = true;

          if (current.numero !== numero) {
            numero = current.numero;
            pdfUrl = await buildPdf(numero);
          }

          invoice = await prisma.invoice.update({
            where: { id: current.id },
            data: {
              montantHT,
              tauxTVA,
              montantTVA,
              montantTTC: order.prixTotal,
              lignes,
              filePath: pdfUrl,
              notes: notes ?? null,
            },
          });
        } else if (targets.includes("numero")) {
          const invoiceCount = await prisma.invoice.count();
          numero = `F-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, "0")}`;
          pdfUrl = await buildPdf(numero);
          invoice = await prisma.invoice.create({ data: { ...createData, numero, filePath: pdfUrl } });
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
  }
  
  res.status(invoiceAlreadyExists ? 200 : 201).json({
    message: invoiceAlreadyExists ? "Facture régénérée avec succès" : "Facture générée avec succès",
    invoice,
    pdfUrl,
    filePath: pdfUrl,
    downloadUrl: `${req.protocol}://${req.get("host")}${pdfUrl}`,
  });
});
