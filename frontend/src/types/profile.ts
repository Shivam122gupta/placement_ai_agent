export interface Education {
  id: string;
  degree: string;
  college: string;
  branch?: string;
  graduation_year?: number;
  cgpa?: number;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
  proficiency?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  github_url?: string;
  live_url?: string;
  role?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date?: string;
  credential_url?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  contact_email?: string;
  phone?: string;
  location?: string;
  target_roles: string[];
  preferred_locations: string[];
  experience_level: string;
  work_preference: string;
  employment_type: string;
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  completion_score: number;
  created_at: string;
  updated_at: string;
}
