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
        accessPressing: boolean;
        accessAtelier: boolean;
      };
    }
  }
}

export {};
