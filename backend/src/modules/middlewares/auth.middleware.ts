import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../env";
import type { UserRole } from "../../types/roles";

type JwtPayload = { 
  sub: string; 
  role: UserRole; 
  prenom: string;
  nom: string;
  telephone: string;
  email?: string;
  clientType?: "pressing" | "atelier" | "both";
  accessPressing: boolean;
  accessAtelier: boolean;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) return res.status(401).json({ error: "Non authentifié" });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { 
      id: payload.sub, 
      role: payload.role,
      prenom: payload.prenom,
      nom: payload.nom,
      telephone: payload.telephone,
      email: payload.email,
      clientType: payload.clientType,
      accessPressing: payload.accessPressing,
      accessAtelier: payload.accessAtelier,
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Token invalide" });
  }
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) return res.status(401).json({ error: "Non authentifié" });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    if (payload.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Accès réservé au Super Admin" });
    }
    
    req.user = { 
      id: payload.sub, 
      role: payload.role,
      prenom: payload.prenom,
      nom: payload.nom,
      telephone: payload.telephone,
      email: payload.email,
      clientType: payload.clientType,
      accessPressing: payload.accessPressing,
      accessAtelier: payload.accessAtelier,
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Token invalide" });
  }
}
