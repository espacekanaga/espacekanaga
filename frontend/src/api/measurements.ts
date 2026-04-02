import { api } from './client';
import type {
  MeasurementField,
  Measurement,
  CreateMeasurementFieldRequest,
  UpdateMeasurementFieldRequest,
  CreateMeasurementRequest,
} from '../types/measurement';
import type { ListQueryParams, PaginatedResponse } from '../types/common';

export const measurementFieldsApi = {
  getAll: async (params?: ListQueryParams): Promise<PaginatedResponse<MeasurementField>> => {
    const { data } = await api.get<PaginatedResponse<MeasurementField>>('/measurement-fields', { params });
    return data;
  },

  getActive: async (): Promise<MeasurementField[]> => {
    const { data } = await api.get<MeasurementField[]>('/measurement-fields/active');
    return data;
  },

  getById: async (id: string): Promise<MeasurementField> => {
    const { data } = await api.get<MeasurementField>(`/measurement-fields/${id}`);
    return data;
  },

  create: async (field: CreateMeasurementFieldRequest): Promise<MeasurementField> => {
    const { data } = await api.post<MeasurementField>('/measurement-fields', field);
    return data;
  },

  update: async (id: string, field: UpdateMeasurementFieldRequest): Promise<MeasurementField> => {
    const { data } = await api.patch<MeasurementField>(`/measurement-fields/${id}`, field);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/measurement-fields/${id}`);
  },
};

export const measurementsApi = {
  getByClient: async (clientId: string): Promise<Measurement[]> => {
    const { data } = await api.get<Measurement[]>(`/measurements/client/${clientId}`);
    return data;
  },

  getById: async (id: string): Promise<Measurement> => {
    const { data } = await api.get<Measurement>(`/measurements/${id}`);
    return data;
  },

  create: async (measurement: CreateMeasurementRequest): Promise<Measurement> => {
    const { data } = await api.post<Measurement>('/measurements', measurement);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/measurements/${id}`);
  },

  getHistory: async (clientId: string): Promise<Measurement[]> => {
    const { data } = await api.get<Measurement[]>(`/measurements/client/${clientId}/history`);
    return data;
  },
};
