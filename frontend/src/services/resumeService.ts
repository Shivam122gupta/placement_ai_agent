import { apiClient } from './api';
import { ResumeItem, ProfileSyncOptions } from '../types/resume';
import { Profile } from '../types/profile';
import { StandardResponse } from '../types/common';

export const resumeService = {
  async uploadResume(file: File): Promise<ResumeItem> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<StandardResponse<ResumeItem>>('/resumes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  },

  async listResumes(): Promise<ResumeItem[]> {
    const response = await apiClient.get<StandardResponse<ResumeItem[]>>('/resumes');
    return response.data.data!;
  },

  async getResume(id: string): Promise<ResumeItem> {
    const response = await apiClient.get<StandardResponse<ResumeItem>>(`/resumes/${id}`);
    return response.data.data!;
  },

  async downloadResume(id: string, filename: string): Promise<void> {
    const response = await apiClient.get(`/resumes/${id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async syncToProfile(id: string, options: ProfileSyncOptions): Promise<Profile> {
    const response = await apiClient.post<StandardResponse<Profile>>(
      `/resumes/${id}/sync-profile`,
      options
    );
    return response.data.data!;
  },

  async deleteResume(id: string): Promise<void> {
    await apiClient.delete(`/resumes/${id}`);
  },
};
