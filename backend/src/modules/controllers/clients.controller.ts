import { Router } from "express";
import bcrypt from "bcrypt";
import { Prisma, OrderStatus, OrderType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../prisma/prismaClient";
import { requireAuth } from "../middlewares/auth.middleware";
import { normalizeEmail, normalizeTelephone } from "../utils/normalize";

const clientSchema = z.object({
  prenom: z.string().min(2),
  nom: z.string().min(2),
  telephone: z.string().min(8),
  email: z.string().email().optional(),
  adresse: z.string().optional(),
  clientType: z.enum(["pressing", "atelier", "both"]).default("both"),
  notes: z.string().optional(),
});

const updateMyProfileSchema = z.object({
  prenom: z.string().min(2).optional(),
  nom: z.string().min(2).optional(),
  telephone: z.string().min(8).optional(),
  email: z.string().email().optional().nullable(),
  adresse: z.string().optional(),
  clientType: z.enum(["pressing", "atelier", "both"]).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

const myOrderSchema = z.object({
  type: z.enum(["pressing", "couture"]),
  prixTotal: z.number().min(0),
  pressing: z
    .object({
      typeVetement: z.string().min(1),
      quantite: z.number().min(1),
      typeService: z.string().min(1),
      instructions: z.string().optional(),
    })
    .optional(),
  couture: z
    .object({
      typeService: z.enum(["sur_mesure", "retouche"]),
      description: z.string().optional(),
      modelReference: z.string().optional(),
      modelNotes: z.string().optional(),
      tissu: z.string().optional(),
      deadline: z.string().optional(),
      modelImage: z.string().optional(),
      measurementId: z.string().uuid().optional(),
      measurementData: z.record(z.string(), z.union([z.number(), z.string(), z.null()])).optional(),
      measurementNotes: z.string().optional(),
    })
    .optional(),
});

export const clientsRouter = Router();

const clientUserSelect = {
  id: true,
  prenom: true,
  nom: true,
  telephone: true,
  email: true,
  adresse: true,
  passwordHash: true,
  role: true,
  isActive: true,
  accessPressing: true,
  accessAtelier: true,
  theme: true,
  createdAt: true,
  updatedAt: true,
} as const;

const measurementSelect = {
  id: true,
  clientId: true,
  orderId: true,
  data: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

const invoiceSelect = {
  id: true,
  orderId: true,
  filePath: true,
  createdAt: true,
} as const;

const orderInclude = {
  client: { select: { id: true, prenom: true, nom: true, telephone: true } },
  pressing: true,
  couture: {
    include: {
      measurement: {
        select: measurementSelect,
      },
    },
  },
  invoice: { select: invoiceSelect },
  createdBy: { select: { id: true, prenom: true, nom: true, role: true } },
  updatedBy: { select: { id: true, prenom: true, nom: true, role: true } },
} as const;

function canClientViewPricing(order: {
  status: OrderStatus;
  invoice?: { filePath: string | null } | null;
}) {
  return (order.status === OrderStatus.termine || order.status === OrderStatus.livre) && Boolean(order.invoice?.filePath);
}

function sanitizeOrderForClient<T extends { prixTotal: number; status: OrderStatus; invoice?: { filePath: string | null } | null }>(order: T) {
  if (canClientViewPricing(order)) {
    return {
      ...order,
      pricingVisible: true,
    };
  }

  return {
    ...order,
    prixTotal: 0,
    invoice: order.invoice ? { ...order.invoice, filePath: null } : order.invoice,
    pricingVisible: false,
  };
}

function ensureNotClient(req: Express.Request, res: any) {
  if (req.user?.role === "CLIENT") {
    res.status(403).json({ error: "Acces refuse" });
    return true;
  }
  return false;
}

function clientAccessFlags(clientType: "pressing" | "atelier" | "both") {
  return {
    accessPressing: clientType === "pressing" || clientType === "both",
    accessAtelier: clientType === "atelier" || clientType === "both",
  };
}

function normalizeMeasurementPayload(input?: Record<string, string | number | null>) {
  if (!input) return undefined;

  const data = Object.entries(input).reduce<Record<string, string | number>>((acc, [rawKey, rawValue]) => {
    const key = rawKey.trim();
    if (!key || rawValue === null || rawValue === undefined) return acc;

    if (typeof rawValue === "number") {
      if (Number.isFinite(rawValue)) {
        acc[key] = rawValue;
      }
      return acc;
    }

    const value = rawValue.trim();
    if (!value) return acc;

    const normalizedNumber = value.replace(",", ".");
    if (/^-?\d+(\.\d+)?$/.test(normalizedNumber)) {
      const parsed = Number(normalizedNumber);
      if (Number.isFinite(parsed)) {
        acc[key] = parsed;
        return acc;
      }
    }

    acc[key] = value;
    return acc;
  }, {});

  return Object.keys(data).length ? data : undefined;
}

function buildCoutureDescription(couture: NonNullable<z.infer<typeof myOrderSchema>["couture"]>) {
  const sections = [
    couture.description?.trim(),
    couture.modelReference?.trim() ? `Modele / reference: ${couture.modelReference.trim()}` : "",
    couture.modelNotes?.trim() ? `Consignes modele: ${couture.modelNotes.trim()}` : "",
  ].filter(Boolean);

  return sections.join("\n\n") || null;
}

async function resolveCurrentClient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: clientUserSelect,
  });
  if (!user) return null;

  const client = await prisma.client.findUnique({
    where: { telephone: user.telephone },
    include: {
      measurements: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!client) return null;

  return { user, client };
}

function clientMePayload(client: any, user: any) {
  return {
    id: client.id,
    userId: user.id,
    prenom: client.prenom,
    nom: client.nom,
    telephone: client.telephone,
    email: client.email,
    adresse: client.adresse,
    notes: client.notes,
    clientType: client.clientType,
    role: user.role,
    isActive: user.isActive,
    accessPressing: user.accessPressing,
    accessAtelier: user.accessAtelier,
    theme: user.theme,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    measurements: client.measurements ?? [],
  };
}

clientsRouter.get("/me", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Non authentifie" });

  const record = await resolveCurrentClient(req.user.id);
  if (!record) return res.status(404).json({ error: "Profil client introuvable" });

  res.json(clientMePayload(record.client, record.user));
});

clientsRouter.patch("/me", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Non authentifie" });

  const parsed = updateMyProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const record = await resolveCurrentClient(req.user.id);
  if (!record) return res.status(404).json({ error: "Profil client introuvable" });

  let normalizedTelephone: string | undefined;
  if (parsed.data.telephone !== undefined) {
    normalizedTelephone = normalizeTelephone(parsed.data.telephone) ?? undefined;
    if (!normalizedTelephone) {
      return res.status(400).json({ error: "Numero de telephone invalide" });
    }
  }

  const normalizedEmail = parsed.data.email !== undefined ? normalizeEmail(parsed.data.email) : undefined;

  if (normalizedTelephone && normalizedTelephone !== record.user.telephone) {
    const existingUser = await prisma.user.findUnique({ where: { telephone: normalizedTelephone }, select: { id: true } });
    const existingClient = await prisma.client.findUnique({ where: { telephone: normalizedTelephone }, select: { id: true } });
    if (existingUser || existingClient) {
      return res.status(409).json({ error: "Numero de telephone deja utilise" });
    }
  }

  if (parsed.data.email !== undefined && normalizedEmail !== record.user.email) {
    if (normalizedEmail) {
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
      const existingClient = await prisma.client.findFirst({ where: { email: normalizedEmail }, select: { id: true } });
      if (existingUser || existingClient) {
        return res.status(409).json({ error: "Email deja utilise" });
      }
    }
  }

  const nextClientType = parsed.data.clientType ?? record.client.clientType;
  const accessFlags = clientAccessFlags(nextClientType);

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: record.user.id },
      data: {
        prenom: parsed.data.prenom,
        nom: parsed.data.nom,
        adresse: parsed.data.adresse,
        ...(normalizedTelephone ? { telephone: normalizedTelephone } : {}),
        ...(parsed.data.email !== undefined ? { email: normalizedEmail } : {}),
        ...accessFlags,
      },
      select: clientUserSelect,
    });

    const client = await tx.client.update({
      where: { id: record.client.id },
      data: {
        prenom: parsed.data.prenom,
        nom: parsed.data.nom,
        adresse: parsed.data.adresse,
        clientType: nextClientType,
        ...(normalizedTelephone ? { telephone: normalizedTelephone } : {}),
        ...(parsed.data.email !== undefined ? { email: normalizedEmail } : {}),
      },
      include: {
        measurements: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    return { user, client };
  });

  res.json(clientMePayload(updated.client, updated.user));
});

clientsRouter.post("/me/password", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Non authentifie" });

  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: clientUserSelect });
  if (!user) return res.status(404).json({ error: "Utilisateur non trouve" });

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: "Mot de passe actuel incorrect" });

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
    select: { id: true },
  });

  res.json({ message: "Mot de passe change avec succes" });
});

clientsRouter.get("/me/orders", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Non authentifie" });

  const record = await resolveCurrentClient(req.user.id);
  if (!record) return res.status(404).json({ error: "Profil client introuvable" });

  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
  const type = typeof req.query.type === "string" ? req.query.type : undefined;

  const where: Prisma.OrderWhereInput = { clientId: record.client.id };
  if (status && status !== "all") {
    where.status = status as OrderStatus;
  }
  if (type === "pressing") {
    where.type = OrderType.pressing;
  } else if (type === "atelier" || type === "couture") {
    where.type = OrderType.couture;
  }

  const orders = await prisma.order.findMany({
    where,
    take: Number.isFinite(limit) ? limit : undefined,
    orderBy: { createdAt: "desc" },
    include: orderInclude,
  });

  res.json(orders.map((order) => sanitizeOrderForClient(order)));
});

clientsRouter.post("/me/orders", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Non authentifie" });

  const parsed = myOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const record = await resolveCurrentClient(req.user.id);
  if (!record) return res.status(404).json({ error: "Profil client introuvable" });

  if (parsed.data.type === "pressing" && !parsed.data.pressing) {
    return res.status(400).json({ error: "Details pressing requis" });
  }

  if (parsed.data.type === "couture" && !parsed.data.couture) {
    return res.status(400).json({ error: "Details atelier requis" });
  }

  if (parsed.data.type === "pressing" && !record.user.accessPressing) {
    return res.status(403).json({ error: "Votre compte n a pas acces a l espace pressing" });
  }

  if (parsed.data.type === "couture" && !record.user.accessAtelier) {
    return res.status(403).json({ error: "Votre compte n a pas acces a l espace atelier" });
  }

  const orderType = parsed.data.type === "pressing" ? OrderType.pressing : OrderType.couture;
  const measurementData =
    parsed.data.type === "couture" ? normalizeMeasurementPayload(parsed.data.couture?.measurementData) : undefined;

  let selectedMeasurementId: string | undefined;
  if (parsed.data.type === "couture" && parsed.data.couture?.measurementId) {
    const existingMeasurement = await prisma.measurement.findFirst({
      where: {
        id: parsed.data.couture.measurementId,
        clientId: record.client.id,
      },
      select: { id: true },
    });

    if (!existingMeasurement) {
      return res.status(404).json({ error: "Mensurations selectionnees introuvables" });
    }

    selectedMeasurementId = existingMeasurement.id;
  }

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        clientId: record.client.id,
        type: orderType,
        status: OrderStatus.en_attente,
        prixTotal: parsed.data.prixTotal,
        createdById: req.user!.id,
        updatedById: req.user!.id,
      },
      include: {
        client: { select: { id: true, prenom: true, nom: true, telephone: true } },
        createdBy: { select: { id: true, prenom: true, nom: true, role: true } },
        updatedBy: { select: { id: true, prenom: true, nom: true, role: true } },
      },
    });

    let coutureMeasurementId = selectedMeasurementId;

    if (parsed.data.type === "couture" && measurementData) {
      const measurement = await tx.measurement.create({
        data: {
          clientId: record.client.id,
          orderId: createdOrder.id,
          data: measurementData as Prisma.InputJsonValue,
          notes: parsed.data.couture?.measurementNotes?.trim() || undefined,
        },
        select: { id: true },
      });

      coutureMeasurementId = measurement.id;
    }

    if (parsed.data.type === "pressing" && parsed.data.pressing) {
      await tx.pressingOrder.create({
        data: {
          orderId: createdOrder.id,
          typeVetement: parsed.data.pressing.typeVetement,
          quantite: parsed.data.pressing.quantite,
          typeService: parsed.data.pressing.typeService,
          instructions: parsed.data.pressing.instructions,
        },
      });
    }

    if (parsed.data.type === "couture" && parsed.data.couture) {
      await tx.coutureOrder.create({
        data: {
          orderId: createdOrder.id,
          typeService: parsed.data.couture.typeService,
          description: buildCoutureDescription(parsed.data.couture),
          measurementId: coutureMeasurementId,
          tissu: parsed.data.couture.tissu,
          deadline: parsed.data.couture.deadline ? new Date(parsed.data.couture.deadline) : null,
          modelImage: parsed.data.couture.modelImage,
        },
      });
    }

    return tx.order.findUnique({
      where: { id: createdOrder.id },
      include: orderInclude,
    });
  });

  res.status(201).json(order ? sanitizeOrderForClient(order) : order);
});

clientsRouter.get("/me/orders/:id", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Non authentifie" });

  const record = await resolveCurrentClient(req.user.id);
  if (!record) return res.status(404).json({ error: "Profil client introuvable" });

  const order = await prisma.order.findFirst({
    where: {
      id: String(req.params.id),
      clientId: record.client.id,
    },
    include: orderInclude,
  });

  if (!order) return res.status(404).json({ error: "Commande non trouvee" });
  res.json(sanitizeOrderForClient(order));
});

clientsRouter.get("/", requireAuth, async (req, res) => {
  if (ensureNotClient(req, res)) return;

  const { search, limit = "50", offset = "0", type } = req.query;
  const where: Prisma.ClientWhereInput = {};

  let searchCondition: Prisma.ClientWhereInput | null = null;
  if (search) {
    searchCondition = {
      OR: [
        { prenom: { contains: search as string, mode: "insensitive" } },
        { nom: { contains: search as string, mode: "insensitive" } },
        { telephone: { contains: search as string } },
      ],
    };
  }

  let typeCondition: Prisma.ClientWhereInput | null = null;
  if (type && type !== "all") {
    typeCondition = {
      OR: [{ clientType: type as any }, { clientType: "both" }],
    };
  }

  if (searchCondition && typeCondition) {
    where.AND = [searchCondition, typeCondition];
  } else if (searchCondition) {
    Object.assign(where, searchCondition);
  } else if (typeCondition) {
    Object.assign(where, typeCondition);
  }

  const orderBy: Prisma.ClientOrderByWithRelationInput[] = [];
  if (type === "atelier") {
    orderBy.push({ clientType: "asc" });
  } else if (type === "pressing") {
    orderBy.push({ clientType: "desc" });
  }
  orderBy.push({ createdAt: "desc" });

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
      orderBy,
    }),
    prisma.client.count({ where }),
  ]);

  res.json({ data: clients, total });
});

clientsRouter.get("/:id", requireAuth, async (req, res) => {
  if (ensureNotClient(req, res)) return;

  const client = await prisma.client.findUnique({
    where: { id: String(req.params.id) },
    include: {
      measurements: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!client) {
    return res.status(404).json({ error: "Client non trouve" });
  }

  res.json(client);
});

clientsRouter.post("/", requireAuth, async (req, res) => {
  if (ensureNotClient(req, res)) return;

  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const measurements = req.body.measurements;
  const existing = await prisma.client.findUnique({ where: { telephone: parsed.data.telephone } });
  if (existing) {
    return res.status(409).json({ error: "Numero de telephone deja utilise" });
  }

  const createData: any = {
    ...parsed.data,
    email: normalizeEmail(parsed.data.email),
  };

  if (measurements && Object.keys(measurements).length > 0) {
    createData.measurements = {
      create: {
        data: measurements,
      },
    };
  }

  const client = await prisma.client.create({
    data: createData,
    include: {
      measurements: true,
    },
  });

  res.status(201).json(client);
});

clientsRouter.patch("/:id", requireAuth, async (req, res) => {
  if (ensureNotClient(req, res)) return;

  const parsed = clientSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const client = await prisma.client.update({
    where: { id: String(req.params.id) },
    data: {
      ...parsed.data,
      ...(parsed.data.email !== undefined ? { email: normalizeEmail(parsed.data.email) } : {}),
    },
  });

  res.json(client);
});

clientsRouter.delete("/:id", requireAuth, async (req, res) => {
  if (ensureNotClient(req, res)) return;

  await prisma.client.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
});
