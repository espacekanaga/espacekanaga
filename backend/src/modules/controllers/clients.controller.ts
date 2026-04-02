import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { requireAuth } from "../middlewares/auth.middleware";

const clientSchema = z.object({
  prenom: z.string().min(2),
  nom: z.string().min(2),
  telephone: z.string().min(8),
  email: z.string().email().optional(),
  adresse: z.string().optional(),
  clientType: z.enum(['pressing', 'atelier', 'both']).default('both'),
  notes: z.string().optional(),
});

export const clientsRouter = Router();

// Get all clients with search and filter by type
clientsRouter.get("/", requireAuth, async (req, res) => {
  const { search, limit = "50", offset = "0", type } = req.query;
  
  const where: any = {};
  
  // Build search condition
  let searchCondition: any = null;
  if (search) {
    searchCondition = {
      OR: [
        { prenom: { contains: search as string, mode: 'insensitive' } },
        { nom: { contains: search as string, mode: 'insensitive' } },
        { telephone: { contains: search as string } },
      ],
    };
  }
  
  // Build type condition (include both)
  let typeCondition: any = null;
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
  } else if (searchCondition) {
    where.OR = searchCondition.OR;
  } else if (typeCondition) {
    where.OR = typeCondition.OR;
  }

  // Build orderBy: prioritize the selected type first, then 'both'
  const orderBy: any[] = [];
  if (type === 'atelier') {
    // atelier comes before both alphabetically (a < b)
    orderBy.push({ clientType: 'asc' });
  } else if (type === 'pressing') {
    // pressing comes after both alphabetically (p > b), so use desc
    orderBy.push({ clientType: 'desc' });
  }
  orderBy.push({ createdAt: 'desc' });

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy,
    }),
    prisma.client.count({ where }),
  ]);

  res.json({ data: clients, total });
});

// Get client by ID
clientsRouter.get("/:id", requireAuth, async (req, res) => {
  const client = await prisma.client.findUnique({
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
clientsRouter.post("/", requireAuth, async (req, res) => {
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
  const existing = await prisma.client.findUnique({ where: { telephone } });
  if (existing) {
    return res.status(409).json({ error: "Numéro de téléphone déjà utilisé" });
  }

  // Create client with measurements if provided
  const createData: any = {
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

  const client = await prisma.client.create({
    data: createData,
    include: {
      measurements: true,
    },
  });
  
  console.log("[DEBUG] Client created:", JSON.stringify(client, null, 2));

  res.status(201).json(client);
});

// Update client
clientsRouter.patch("/:id", requireAuth, async (req, res) => {
  const parsed = clientSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const client = await prisma.client.update({
    where: { id: String(req.params.id) },
    data: parsed.data,
  });

  res.json(client);
});

// Delete client
clientsRouter.delete("/:id", requireAuth, async (req, res) => {
  await prisma.client.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
});
