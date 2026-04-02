export type OrderType = 'pressing' | 'couture';
export type OrderStatus = 'en_attente' | 'en_cours' | 'termine' | 'livre';
export type CoutureServiceType = 'retouche' | 'sur_mesure';

export interface Order {
  id: string;
  clientId: string;
  type: OrderType;
  status: OrderStatus;
  prixTotal: number;
  createdById: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
  };
  createdBy: {
    id: string;
    prenom: string;
    nom: string;
    role: string;
  };
  updatedBy: {
    id: string;
    prenom: string;
    nom: string;
    role: string;
  };
  pressing?: PressingOrder | null;
  couture?: CoutureOrder | null;
  invoice?: Invoice | null;
}

export interface PressingOrder {
  id: string;
  orderId: string;
  typeVetement: string;
  quantite: number;
  typeService: string;
  instructions: string | null;
  dateRecuperation: string | null;
}

export interface CoutureOrder {
  id: string;
  orderId: string;
  typeService: CoutureServiceType;
  description: string | null;
  measurementId: string | null;
  tissu: string | null;
  deadline: string | null;
  modelImage: string | null; // URL/path to model image
  measurement?: {
    id: string;
    data: Record<string, number | string>;
  } | null;
}

export interface Invoice {
  id: string;
  orderId: string;
  filePath: string;
  createdAt: string;
}

export interface CreateOrderRequest {
  clientId: string;
  type: OrderType;
  prixTotal: number;
  pressing?: {
    typeVetement: string;
    quantite: number;
    typeService: string;
    instructions?: string;
    dateRecuperation?: string;
  };
  couture?: {
    typeService: CoutureServiceType;
    description?: string;
    measurementId?: string;
    tissu?: string;
    deadline?: string;
    modelImage?: string; // Base64 encoded image
  };
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}
