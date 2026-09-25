import { apiClient } from './api';
import { SkillGapRoadmap, RoadmapGenerateRequest } from '../types/skillGap';
import { StandardResponse } from '../types/common';

export const skillGapService = {
  generateRoadmap: async (payload: RoadmapGenerateRequest): Promise<SkillGapRoadmap> => {
    const res = await apiClient.post<StandardResponse<SkillGapRoadmap>>('/skill-gaps/generate', payload);
    return res.data.data!;
  },

  listRoadmaps: async (): Promise<SkillGapRoadmap[]> => {
    const res = await apiClient.get<StandardResponse<SkillGapRoadmap[]>>('/skill-gaps');
    return res.data.data!;
  },

  getRoadmapById: async (roadmapId: string): Promise<SkillGapRoadmap> => {
    const res = await apiClient.get<StandardResponse<SkillGapRoadmap>>(`/skill-gaps/${roadmapId}`);
    return res.data.data!;
  },

  toggleMilestone: async (roadmapId: string, milestoneIndex: number): Promise<SkillGapRoadmap> => {
    const res = await apiClient.patch<StandardResponse<SkillGapRoadmap>>(
      `/skill-gaps/${roadmapId}/milestones/${milestoneIndex}/toggle`
    );
    return res.data.data!;
  },

  deleteRoadmap: async (roadmapId: string): Promise<void> => {
    await apiClient.delete(`/skill-gaps/${roadmapId}`);
  },
};
