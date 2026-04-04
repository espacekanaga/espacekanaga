import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../prisma/prismaClient";
import { requireAuth, requireSuperAdmin } from "../middlewares/auth.middleware";

const DAY_NAMES = [
  "Dimanche",
  "Lundi", 
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi"
];

// Initialize default schedule if empty
async function initializeDefaultSchedule() {
  const count = await prisma.workSchedule.count();
  if (count === 0) {
    const defaultSchedule = [
      { dayOfWeek: 1, isOpen: true, openTime: "08:00", closeTime: "18:00" },
      { dayOfWeek: 2, isOpen: true, openTime: "08:00", closeTime: "18:00" },
      { dayOfWeek: 3, isOpen: true, openTime: "08:00", closeTime: "18:00" },
      { dayOfWeek: 4, isOpen: true, openTime: "08:00", closeTime: "18:00" },
      { dayOfWeek: 5, isOpen: true, openTime: "08:00", closeTime: "18:00" },
      { dayOfWeek: 6, isOpen: true, openTime: "08:00", closeTime: "18:00" },
      { dayOfWeek: 0, isOpen: false, openTime: null, closeTime: null },
    ];
    
    await prisma.workSchedule.createMany({
      data: defaultSchedule
    });
  }
}

export const workScheduleRouter = Router();

// GET /api/settings/work-schedule - Get all work schedules
workScheduleRouter.get("/", requireAuth, async (_req, res) => {
  try {
    await initializeDefaultSchedule();
    
    const schedules = await prisma.workSchedule.findMany({
      orderBy: { dayOfWeek: "asc" }
    });
    
    // Transform to frontend format
    const formatted = schedules.map(s => ({
      day: DAY_NAMES[s.dayOfWeek],
      enabled: s.isOpen,
      openTime: s.openTime || "08:00",
      closeTime: s.closeTime || "18:00",
      dayOfWeek: s.dayOfWeek
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error("Error fetching work schedules:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des horaires" });
  }
});

// PUT /api/settings/work-schedule - Update all work schedules
workScheduleRouter.put("/", requireSuperAdmin, async (req, res) => {
  const scheduleItemSchema = z.object({
    day: z.string(),
    enabled: z.boolean(),
    openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  });
  
  const bodySchema = z.array(scheduleItemSchema);
  
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Format invalide", details: parsed.error.flatten() });
  }
  
  try {
    const dayNameToIndex: Record<string, number> = {
      "Dimanche": 0,
      "Lundi": 1,
      "Mardi": 2,
      "Mercredi": 3,
      "Jeudi": 4,
      "Vendredi": 5,
      "Samedi": 6,
    };
    
    // Update each schedule
    for (const item of parsed.data) {
      const dayOfWeek = dayNameToIndex[item.day];
      if (dayOfWeek === undefined) {
        continue;
      }
      
      await prisma.workSchedule.upsert({
        where: { dayOfWeek },
        update: {
          isOpen: item.enabled,
          openTime: item.enabled ? item.openTime : null,
          closeTime: item.enabled ? item.closeTime : null,
        },
        create: {
          dayOfWeek,
          isOpen: item.enabled,
          openTime: item.enabled ? item.openTime : null,
          closeTime: item.enabled ? item.closeTime : null,
        },
      });
    }
    
    // Return updated schedules
    const schedules = await prisma.workSchedule.findMany({
      orderBy: { dayOfWeek: "asc" }
    });
    
    const formatted = schedules.map(s => ({
      day: DAY_NAMES[s.dayOfWeek],
      enabled: s.isOpen,
      openTime: s.openTime || "08:00",
      closeTime: s.closeTime || "18:00",
      dayOfWeek: s.dayOfWeek
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error("Error updating work schedules:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour des horaires" });
  }
});
