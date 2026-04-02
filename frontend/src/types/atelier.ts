export interface Formation {
  id: string;
  titre: string;
  description: string | null;
  niveau: 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE';
  dureeHeures: number;
  prix: number;
  maxParticipants: number;
  dateDebut: string | null;
  dateFin: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormationInscription {
  id: string;
  formationId: string;
  clientId: string;
  dateInscription: string;
  statut: 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  paiementStatut: 'EN_ATTENTE' | 'PARTIEL' | 'PAYE';
  montantPaye: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockTissu {
  id: string;
  nom: string;
  type: string;
  couleur: string;
  quantite: number;
  unite: 'METRE' | 'YARD' | 'PIECE';
  prixUnitaire: number;
  fournisseur: string | null;
  dateAchat: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AtelierService {
  id: string;
  nom: string;
  type: 'COUTURE' | 'RETOUCHE' | 'CONFECTION_SUR_MESURE' | 'REPARATION';
  description: string | null;
  prixBase: number;
  dureeEstimee: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormationRequest {
  titre: string;
  description?: string;
  niveau: 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE';
  dureeHeures: number;
  prix: number;
  maxParticipants: number;
  dateDebut?: string;
  dateFin?: string;
}

export interface CreateStockTissuRequest {
  nom: string;
  type: string;
  couleur: string;
  quantite: number;
  unite: 'METRE' | 'YARD' | 'PIECE';
  prixUnitaire: number;
  fournisseur?: string;
  dateAchat?: string;
}

export interface CreateAtelierServiceRequest {
  nom: string;
  type: 'COUTURE' | 'RETOUCHE' | 'CONFECTION_SUR_MESURE' | 'REPARATION';
  description?: string;
  prixBase: number;
  dureeEstimee: number;
}
