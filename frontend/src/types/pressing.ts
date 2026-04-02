export interface PressingLaundryType {
  id: string;
  nom: string;
  description: string | null;
  prixBase: number;
  dureeEstimee: number;
  createdAt: string;
  updatedAt: string;
}

export interface PressingArticle {
  id: string;
  nom: string;
  categorie: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PressingService {
  id: string;
  laundryTypeId: string;
  articleId: string;
  prix: number;
  laundryType: PressingLaundryType;
  article: PressingArticle;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLaundryTypeRequest {
  nom: string;
  description?: string;
  prixBase: number;
  dureeEstimee: number;
}

export interface CreateArticleRequest {
  nom: string;
  categorie: string;
  description?: string;
}

export interface CreateServiceRequest {
  laundryTypeId: string;
  articleId: string;
  prix: number;
}
