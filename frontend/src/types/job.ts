export interface JobRequirement {
  required_skills: string[];
  preferred_skills: string[];
  min_experience_years: number;
  max_experience_years?: number;
  required_education?: string;
  responsibilities: string[];
  role_summary?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  employment_type: string;
  description_raw: string;
  source: string;
  source_url?: string;
  dedup_hash: string;
  requirements: JobRequirement;
  posted_at?: string;
  discovered_at: string;
  last_verified_at: string;
}

export interface JobSearchFilters {
  query?: string;
  location?: string;
  employment_type?: string;
  skills?: string[];
  limit?: number;
}

export interface JDAnalysisRequest {
  raw_text: string;
  title?: string;
  company?: string;
}

export interface JDAnalysisResponse {
  title: string;
  company: string;
  raw_text: string;
  requirements: JobRequirement;
}
