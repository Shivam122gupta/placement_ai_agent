import { apiClient } from './api';
import { JobMatch, RecommendedJob } from '../types/matching';
import { StandardResponse } from '../types/common';

export const matchingService = {
  matchJob: async (jobId: string): Promise<JobMatch> => {
    const res = await apiClient.post<StandardResponse<JobMatch>>(`/jobs/${jobId}/match`);
    return res.data.data!;
  },

  getJobMatch: async (jobId: string): Promise<JobMatch> => {
    const res = await apiClient.get<StandardResponse<JobMatch>>(`/jobs/${jobId}/match`);
    return res.data.data!;
  },

  getTopRecommendations: async (): Promise<RecommendedJob[]> => {
    const res = await apiClient.get<StandardResponse<RecommendedJob[]>>('/recommendations/top-matches');
    return res.data.data!;
  },
};
