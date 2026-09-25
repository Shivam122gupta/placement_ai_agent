import { apiClient } from './api';
import { Profile, Education, Skill, Project, Certification } from '../types/profile';
import { StandardResponse } from '../types/common';

export const profileService = {
  async getProfile(): Promise<Profile> {
    const response = await apiClient.get<StandardResponse<Profile>>('/profile');
    return response.data.data!;
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const response = await apiClient.patch<StandardResponse<Profile>>('/profile', updates);
    return response.data.data!;
  },

  async addEducation(edu: Omit<Education, 'id'>): Promise<Profile> {
    const response = await apiClient.post<StandardResponse<Profile>>('/profile/education', edu);
    return response.data.data!;
  },

  async deleteEducation(id: string): Promise<Profile> {
    const response = await apiClient.delete<StandardResponse<Profile>>(`/profile/education/${id}`);
    return response.data.data!;
  },

  async addSkill(skill: Omit<Skill, 'id'>): Promise<Profile> {
    const response = await apiClient.post<StandardResponse<Profile>>('/profile/skills', skill);
    return response.data.data!;
  },

  async deleteSkill(id: string): Promise<Profile> {
    const response = await apiClient.delete<StandardResponse<Profile>>(`/profile/skills/${id}`);
    return response.data.data!;
  },

  async addProject(project: Omit<Project, 'id'>): Promise<Profile> {
    const response = await apiClient.post<StandardResponse<Profile>>('/profile/projects', project);
    return response.data.data!;
  },

  async deleteProject(id: string): Promise<Profile> {
    const response = await apiClient.delete<StandardResponse<Profile>>(`/profile/projects/${id}`);
    return response.data.data!;
  },

  async addCertification(cert: Omit<Certification, 'id'>): Promise<Profile> {
    const response = await apiClient.post<StandardResponse<Profile>>('/profile/certifications', cert);
    return response.data.data!;
  },

  async deleteCertification(id: string): Promise<Profile> {
    const response = await apiClient.delete<StandardResponse<Profile>>(`/profile/certifications/${id}`);
    return response.data.data!;
  },
};
