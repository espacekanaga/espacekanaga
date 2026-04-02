import type { OrderType } from './order';

export type InvoiceStatus = 'emise' | 'envoyee' | 'payee' | 'annulee' | 'en_retard';

export interface InvoiceLine {
  description: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
}

export interface InvoiceOrderSummary {
  id: string;
  type: OrderType;
  prixTotal: number;
  createdAt: string;
  client: {
    id: string;
    prenom: string;
    nom: string;
    telephone: string;
  };
}

export interface InvoiceSummary {
  id: string;
  orderId: string;
  numero: string;
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  statut: InvoiceStatus;
  notes?: string | null;
  filePath?: string | null;
  downloadUrl?: string;
  createdAt: string;
  order: InvoiceOrderSummary;
}

export interface InvoiceDetail extends Omit<InvoiceSummary, 'order'> {
  lignes: InvoiceLine[];
  order: InvoiceOrderSummary & {
    status: string;
    client: {
      id: string;
      prenom: string;
      nom: string;
      telephone: string;
      email?: string | null;
      adresse?: string | null;
    };
    createdBy?: {
      id: string;
      prenom: string;
      nom: string;
      role: string;
    } | null;
  };
}

