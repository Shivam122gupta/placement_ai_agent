export interface SkillMatchDetail {
  skill: string;
  is_required: boolean;
  matched: boolean;
  evidence_snippet?: string;
  confidence: number;
}

export interface JobMatch {
  id: string;
  user_id: string;
  job_id: string;
  overall_score: number; // 0 - 100
  skills_score: number;
  experience_score: number;
  matched_skills: string[];
  missing_skills: string[];
  partial_skills: string[];
  skill_details: SkillMatchDetail[];
  summary_reasoning: string;
  strengths: string[];
  key_gaps: string[];
  created_at: string;
  updated_at: string;
}

export interface RecommendedJob {
  job_id: string;
  title: string;
  company: string;
  location: string;
  employment_type: string;
  overall_score: number;
  matched_count: number;
  missing_count: number;
}
