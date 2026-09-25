export interface RoadmapMilestone {
  day_or_week: string;
  title: string;
  target_skills: string[];
  key_topics: string[];
  practice_project_idea?: string;
  recommended_resources: string[];
  completed: boolean;
}

export interface SkillGapRoadmap {
  id: string;
  user_id: string;
  job_id?: string;
  target_role: string;
  duration_type: '1_week' | '2_weeks' | '1_month';
  gap_skills: string[];
  milestones: RoadmapMilestone[];
  readiness_impact: string;
  created_at: string;
  updated_at: string;
}

export interface RoadmapGenerateRequest {
  job_id?: string;
  target_role?: string;
  duration_type?: '1_week' | '2_weeks' | '1_month';
  custom_gap_skills?: string[];
}
