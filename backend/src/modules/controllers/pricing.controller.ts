import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../prisma/prismaClient";
import { requireAuth, requireSuperAdmin } from "../middlewares/auth.middleware";

// Default pricing if none exists
const DEFAULT_PRESSING_PRICING = [
  { serviceName: "Chemise", price: 2500, category: "pressing" },
  { serviceName: "Pantalon", price: 3000, category: "pressing" },
  { serviceName: "Robe", price: 4500, category: "pressing" },
  { serviceName: "Veste", price: 3500, category: "pressing" },
  { serviceName: "Costume complet", price: 6000, category: "pressing" },
];

const DEFAULT_ATELIER_PRICING = [
  { serviceName: "Ourlet simple", price: 2000, category: "atelier" },
  { serviceName: "Retouche taille", price: 3500, category: "atelier" },
  { serviceName: "Reparation zip", price: 4000, category: "atelier" },
  { serviceName: "Couture sur mesure", price: 15000, category: "atelier" },
  { serviceName: "Retouche manche", price: 2500, category: "atelier" },
];

// Initialize default pricing if empty
async function initializeDefaultPricing() {
  const count = await prisma.pricing.count();
  if (count === 0) {
    await prisma.pricing.createMany({
      data: [...DEFAULT_PRESSING_PRICING, ...DEFAULT_ATELIER_PRICING]
    });
  }
}

async function getFormattedPricing() {
  await initializeDefaultPricing();

  const pricing = await prisma.pricing.findMany({
    orderBy: [{ category: "asc" }, { serviceName: "asc" }]
  });

  const pressing = pricing
    .filter(p => p.category === "pressing")
    .map(p => [p.serviceName, `${p.price.toLocaleString('fr-FR')} FCFA`]);

  const atelier = pricing
    .filter(p => p.category === "atelier")
    .map(p => [p.serviceName, `${p.price.toLocaleString('fr-FR')} FCFA`]);

  return { pressing, atelier };
}

export const pricingRouter = Router();

// GET /api/settings/pricing - Get all pricing
pricingRouter.get("/", requireAuth, async (_req, res) => {
  try {
    const formatted = await getFormattedPricing();
    res.json(formatted);
  } catch (error) {
    console.error("Error fetching pricing:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des tarifs" });
  }
});

// GET /api/public/pricing - Get public pricing (no auth required)
export async function getPublicPricing(_req: unknown, res: any) {
  try {
    const formatted = await getFormattedPricing();
    res.json(formatted);
  } catch (error) {
    console.error("Error fetching public pricing:", error);
    res.status(500).json({ error: "Erreur lors de la recuperation des tarifs publics" });
  }
}

// PUT /api/settings/pricing - Update all pricing (super admin only)
pricingRouter.put("/", requireSuperAdmin, async (req, res) => {
  const pricingItemSchema = z.object({
    serviceName: z.string().min(1),
    price: z.number().int().positive(),
    category: z.enum(["pressing", "atelier"]),
  });
  
  const bodySchema = z.array(pricingItemSchema);
  
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Format invalide", details: parsed.error.flatten() });
  }
  
  try {
    // Delete existing pricing and recreate
    await prisma.pricing.deleteMany();
    
    await prisma.pricing.createMany({
      data: parsed.data
    });
    
    const formatted = await getFormattedPricing();
    res.json(formatted);
  } catch (error) {
    console.error("Error updating pricing:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour des tarifs" });
  }
});

// POST /api/settings/pricing/item - Add or update single pricing item
pricingRouter.post("/item", requireSuperAdmin, async (req, res) => {
  const itemSchema = z.object({
    serviceName: z.string().min(1),
    price: z.number().int().positive(),
    category: z.enum(["pressing", "atelier"]),
  });
  
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Format invalide", details: parsed.error.flatten() });
  }
  
  try {
    await prisma.pricing.upsert({
      where: {
        serviceName_category: {
          serviceName: parsed.data.serviceName,
          category: parsed.data.category
        }
      },
      update: { price: parsed.data.price },
      create: parsed.data
    });
    
    const formatted = await getFormattedPricing();
    res.json(formatted);
  } catch (error) {
    console.error("Error updating pricing item:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du tarif" });
  }
});

// DELETE /api/settings/pricing/item - Delete a pricing item
pricingRouter.delete("/item", requireSuperAdmin, async (req, res) => {
  const deleteSchema = z.object({
    serviceName: z.string().min(1),
    category: z.enum(["pressing", "atelier"]),
  });
  
  const parsed = deleteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Format invalide", details: parsed.error.flatten() });
  }
  
  try {
    await prisma.pricing.delete({
      where: {
        serviceName_category: {
          serviceName: parsed.data.serviceName,
          category: parsed.data.category
        }
      }
    });
    
    const formatted = await getFormattedPricing();
    res.json(formatted);
  } catch (error) {
    console.error("Error deleting pricing item:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du tarif" });
  }
});
