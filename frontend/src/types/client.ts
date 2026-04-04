export interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string | null;
  adresse: string | null;
  notes: string | null;
  clientType: 'pressing' | 'atelier' | 'both';
  createdAt: string;
  updatedAt: string;
  measurements?: Measurement[];
}

export interface Measurement {
  id: string;
  clientId: string;
  orderId?: string | null;
  data: Record<string, number | string>;
  notes: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateClientRequest extends Record<string, unknown> {
  nom: string;
  prenom: string;
  telephone: string;
  adresse?: string;
  notes?: string;
  clientType: 'pressing' | 'atelier' | 'both';
  measurements?: Record<string, number | undefined>;
}

export interface UpdateClientRequest {
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string | null;
  adresse?: string;
  notes?: string;
  clientType?: 'pressing' | 'atelier' | 'both';
}

export const clientTypeLabels: Record<string, string> = {
  pressing: 'Pressing',
  atelier: 'Atelier',
  both: 'Les deux',
};

export const clientTypeColors: Record<string, string> = {
  pressing: 'bg-blue-100 text-blue-800',
  atelier: 'bg-purple-100 text-purple-800',
  both: 'bg-green-100 text-green-800',
};

// Standard measurement fields for atelier clients
export const standardMeasurementFields = [
  { name: 'epaule', label: 'Épaule', unite: 'cm' },
  { name: 'poitrine', label: 'Poitrine', unite: 'cm' },
  { name: 'taille', label: 'Taille', unite: 'cm' },
  { name: 'hanche', label: 'Hanche', unite: 'cm' },
  { name: 'longueur_totale', label: 'Longueur totale', unite: 'cm' },
  { name: 'manche', label: 'Manche', unite: 'cm' },
  { name: 'tour_bras', label: 'Tour de bras', unite: 'cm' },
  { name: 'tour_poignet', label: 'Tour de poignet', unite: 'cm' },
  { name: 'encolure', label: 'Encolure', unite: 'cm' },
  { name: 'hauteur_buste', label: 'Hauteur de buste', unite: 'cm' },
  { name: 'hauteur_dos', label: 'Hauteur de dos', unite: 'cm' },
  { name: 'longueur_jupe', label: 'Longueur de jupe', unite: 'cm' },
  { name: 'longueur_pantalon', label: 'Longueur de pantalon', unite: 'cm' },
];
