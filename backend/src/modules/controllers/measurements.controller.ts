import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma/prismaClient";
import { requireAuth } from "../middlewares/auth.middleware";

const measurementSchema = z.object({
  clientId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  data: z.record(z.string(), z.number()),
  notes: z.string().optional(),
});

export const measurementsRouter = Router();

// Get all measurements
measurementsRouter.get("/", requireAuth, async (req, res) => {
  const { clientId, limit = "50" } = req.query;

  const where: any = {};
  if (clientId) {
    where.clientId = String(clientId);
  }

  const measurements = await prisma.measurement.findMany({
    where,
    take: parseInt(limit as string),
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, prenom: true, nom: true, telephone: true } },
      order: { select: { id: true, type: true, status: true } },
    },
  });

  res.json(measurements);
});

// Get measurements by client ID
measurementsRouter.get("/client/:clientId", requireAuth, async (req, res) => {
  const { clientId } = req.params;

  const measurements = await prisma.measurement.findMany({
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
measurementsRouter.get("/:id", requireAuth, async (req, res) => {
  const measurement = await prisma.measurement.findUnique({
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
measurementsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = measurementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { clientId, orderId, data, notes } = parsed.data;

  // Check client exists
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return res.status(404).json({ error: "Client non trouvé" });
  }

  const measurement = await prisma.measurement.create({
    data: {
      clientId,
      orderId,
      data: data as any,
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
measurementsRouter.patch("/:id", requireAuth, async (req, res) => {
  const parsed = measurementSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const measurement = await prisma.measurement.update({
    where: { id: String(req.params.id) },
    data: {
      ...parsed.data,
      data: parsed.data.data as any,
    },
    include: {
      client: { select: { id: true, prenom: true, nom: true, telephone: true } },
      order: { select: { id: true, type: true, status: true } },
    },
  });

  res.json(measurement);
});

// Delete measurement
measurementsRouter.delete("/:id", requireAuth, async (req, res) => {
  await prisma.measurement.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
});
