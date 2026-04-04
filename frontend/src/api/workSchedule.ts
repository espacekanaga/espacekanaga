import { api } from './client';

export interface WorkSchedule {
  day: string;
  enabled?: boolean;
  openTime: string;
  closeTime: string;
  dayOfWeek?: number;
}

export const workScheduleApi = {
  get: async (): Promise<WorkSchedule[]> => {
    const { data } = await api.get<WorkSchedule[]>('/settings/work-schedule');
    return data;
  },

  update: async (schedules: WorkSchedule[]): Promise<WorkSchedule[]> => {
    const { data } = await api.put<WorkSchedule[]>('/settings/work-schedule', schedules);
    return data;
  },
};
