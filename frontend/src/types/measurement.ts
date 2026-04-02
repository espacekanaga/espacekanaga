export type MeasurementFieldType = 'number' | 'text';

export interface MeasurementField {
  id: string;
  name: string;
  label: string;
  type: MeasurementFieldType;
  unite: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeasurementFieldRequest {
  name: string;
  label: string;
  type: MeasurementFieldType;
  unite?: string;
}

export interface UpdateMeasurementFieldRequest {
  name?: string;
  label?: string;
  type?: MeasurementFieldType;
  unite?: string;
  isActive?: boolean;
}

export interface Measurement {
  id: string;
  clientId: string;
  orderId: string | null;
  data: Record<string, number | string>;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    nom: string;
    prenom: string;
  };
  order?: {
    id: string;
    type: string;
  } | null;
}

export interface CreateMeasurementRequest {
  clientId: string;
  orderId?: string;
  data: Record<string, number | string>;
  notes?: string;
}
