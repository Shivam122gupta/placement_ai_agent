export type ApplicationStatus =
  | 'SAVED'
  | 'APPLIED'
  | 'ASSESSMENT'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface Application {
  id: string;
  user_id: string;
  job_id?: string;
  company_name: string;
  job_title: string;
  status: ApplicationStatus | string;
  applied_date?: string;
  interview_date?: string;
  next_action?: string;
  next_action_date?: string;
  notes?: string;
  salary_offered?: string;
  location?: string;
  match_score?: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicationCreate {
  job_id?: string;
  company_name?: string;
  job_title?: string;
  status?: string;
  applied_date?: string;
  interview_date?: string;
  next_action?: string;
  next_action_date?: string;
  notes?: string;
  salary_offered?: string;
  location?: string;
}

export interface ApplicationUpdate {
  status?: string;
  applied_date?: string;
  interview_date?: string;
  next_action?: string;
  next_action_date?: string;
  notes?: string;
  salary_offered?: string;
  location?: string;
}

export interface PipelineStats {
  total_applications: number;
  active_pipeline: number;
  interviews_count: number;
  offers_count: number;
  status_counts: Record<string, number>;
  interview_conversion_rate: number;
  offer_conversion_rate: number;
}
