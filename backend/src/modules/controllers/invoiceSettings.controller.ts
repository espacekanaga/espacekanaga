import { Router, type Request } from "express";
import { z } from "zod";

import { prisma } from "../../prisma/prismaClient";
import { requireAuth } from "../middlewares/auth.middleware";

type Scope = "global" | "pressing" | "atelier";

function canEditScope(scope: Scope, user: Request["user"] | undefined) {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (scope === "global") return false;
  if (scope === "pressing") return user.accessPressing === true;
  if (scope === "atelier") return user.accessAtelier === true;
  return false;
}

function defaultGlobalSettings() {
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

async function getOrCreate(scope: Scope) {
  const existing = await prisma.invoiceSettings.findUnique({ where: { scope } });
  if (existing) return existing;

  if (scope === "global") {
    return prisma.invoiceSettings.create({
      data: { scope, ...defaultGlobalSettings() },
    });
  }

  return prisma.invoiceSettings.create({
    data: { scope, tauxTVA: 18, notes: "" },
  });
}

export const invoiceSettingsRouter = Router();

invoiceSettingsRouter.get("/", requireAuth, async (_req, res) => {
  const [global, pressing, atelier] = await Promise.all([
    getOrCreate("global"),
    getOrCreate("pressing"),
    getOrCreate("atelier"),
  ]);

  res.json({ global, pressing, atelier });
});

invoiceSettingsRouter.put("/:scope", requireAuth, async (req, res) => {
  const scopeSchema = z.enum(["global", "pressing", "atelier"]);
  const parsedScope = scopeSchema.safeParse(req.params.scope);
  if (!parsedScope.success) return res.status(400).json({ error: "Scope invalide" });
  const scope = parsedScope.data as Scope;

  if (!canEditScope(scope, req.user)) {
    return res.status(403).json({ error: "Accès refusé" });
  }

  const hexColor = z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Couleur invalide")
    .optional();

  const globalSchema = z.object({
    companyName: z.string().min(1).max(120).optional(),
    companyTagline: z.string().max(120).optional(),
    companyAddress: z.string().max(200).optional(),
    companyPhone: z.string().max(80).optional(),
    companyEmail: z.string().max(120).optional(),
    companyNIF: z.string().max(80).optional(),
    companyRCCM: z.string().max(80).optional(),
    stampEnabled: z.boolean().optional(),
    stampLine1: z.string().max(60).optional(),
    stampLine2: z.string().max(60).optional(),
    stampLine3: z.string().max(60).optional(),
    stampColor: hexColor,
    footerLine1: z.string().max(200).optional(),
    footerLine2: z.string().max(200).optional(),
  });

  const workspaceSchema = z.object({
    tauxTVA: z.coerce.number().min(0).max(100).optional(),
    notes: z.string().max(2000).optional(),
  });

  const schema = scope === "global" ? globalSchema : workspaceSchema;
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // ensure exists
  await getOrCreate(scope);

  const updated = await prisma.invoiceSettings.update({
    where: { scope },
    data: parsed.data,
  });

  res.json(updated);
});
