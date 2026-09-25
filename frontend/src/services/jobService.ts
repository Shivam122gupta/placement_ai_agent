import { apiClient } from './api';
import { Job, JobSearchFilters, JDAnalysisRequest, JDAnalysisResponse } from '../types/job';
import { StandardResponse } from '../types/common';

export const jobService = {
  listJobs: async (params?: JobSearchFilters): Promise<Job[]> => {
    const res = await apiClient.get<StandardResponse<Job[]>>('/jobs', { params });
    return res.data.data!;
  },

  searchJobs: async (payload: JobSearchFilters): Promise<Job[]> => {
    const res = await apiClient.post<StandardResponse<Job[]>>('/jobs/search', payload);
    return res.data.data!;
  },

  getJobById: async (jobId: string): Promise<Job> => {
    const res = await apiClient.get<StandardResponse<Job>>(`/jobs/${jobId}`);
    return res.data.data!;
  },

  analyzeJD: async (payload: JDAnalysisRequest): Promise<JDAnalysisResponse> => {
    const res = await apiClient.post<StandardResponse<JDAnalysisResponse>>('/jobs/analyze-jd', payload);
    return res.data.data!;
  },
};
