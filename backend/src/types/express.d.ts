import type { UserRole } from "./roles";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        prenom: string;
        nom: string;
        telephone: string;
        email?: string;
        clientType?: "pressing" | "atelier" | "both";
        accessPressing: boolean;
        accessAtelier: boolean;
      };
    }
  }
}

export {};
