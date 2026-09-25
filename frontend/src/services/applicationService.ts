import { apiClient } from './api';
import {
  Application,
  ApplicationCreate,
  ApplicationUpdate,
  PipelineStats,
} from '../types/application';

export const applicationService = {
  createApplication: async (payload: ApplicationCreate): Promise<Application> => {
    const response = await apiClient.post<Application>('/applications', payload);
    return response.data;
  },

  listApplications: async (status?: string, search?: string): Promise<Application[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (search) params.search = search;
    const response = await apiClient.get<Application[]>('/applications', { params });
    return response.data;
  },

  getStats: async (): Promise<PipelineStats> => {
    const response = await apiClient.get<PipelineStats>('/applications/stats');
    return response.data;
  },

  getApplication: async (applicationId: string): Promise<Application> => {
    const response = await apiClient.get<Application>(`/applications/${applicationId}`);
    return response.data;
  },

  updateApplication: async (applicationId: string, payload: ApplicationUpdate): Promise<Application> => {
    const response = await apiClient.patch<Application>(`/applications/${applicationId}`, payload);
    return response.data;
  },

  deleteApplication: async (applicationId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/applications/${applicationId}`);
    return response.data;
  },
};
