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

// Middleware pour vérifier l'accès à l'espace Pressing
export function requirePressingAccess(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Non authentifié" });
  
  // Super Admin a accès à tout
  if (user.role === "SUPER_ADMIN") return next();
  
  // Vérifier la permission d'accès au pressing
  if (user.accessPressing) return next();
  
  return res.status(403).json({ error: "Accès à l'espace Pressing refusé" });
}

// Middleware pour vérifier l'accès à l'espace Atelier
export function requireAtelierAccess(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Non authentifié" });
  
  // Super Admin a accès à tout
  if (user.role === "SUPER_ADMIN") return next();
  
  // Vérifier la permission d'accès à l'atelier
  if (user.accessAtelier) return next();
  
  return res.status(403).json({ error: "Accès à l'espace Atelier refusé" });
}

// Middleware combiné - accès à au moins un espace
export function requireAnyWorkspaceAccess(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Non authentifié" });
  
  // Super Admin a accès à tout
  if (user.role === "SUPER_ADMIN") return next();
  
  // Vérifier l'accès à au moins un espace
  if (user.accessPressing || user.accessAtelier) return next();
  
  return res.status(403).json({ error: "Aucun espace de travail assigné" });
}

// Middleware combiné - accès aux deux espaces
export function requireBothWorkspacesAccess(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Non authentifié" });
  
  // Super Admin a accès à tout
  if (user.role === "SUPER_ADMIN") return next();
  
  // Vérifier l'accès aux deux espaces
  if (user.accessPressing && user.accessAtelier) return next();
  
  return res.status(403).json({ error: "Accès aux deux espaces requis" });
}
