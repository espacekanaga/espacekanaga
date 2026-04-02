import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../../types/roles";

export function requireRoles(...allowed: UserRole[]) {
  return function roleGuard(req: Request, res: Response, next: NextFunction) {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: "Non authentifié" });
    if (!allowed.includes(role)) return res.status(403).json({ error: "Accès refusé" });
    return next();
  };
}

