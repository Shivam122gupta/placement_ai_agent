export interface ParsedEducation {
  id: string;
  degree: string;
  college: string;
  branch?: string;
  graduation_year?: number;
  cgpa?: number;
}

export interface ParsedSkill {
  id: string;
  name: string;
  category?: string;
  proficiency?: string;
}

export interface ParsedExperience {
  id: string;
  company: string;
  role: string;
  duration?: string;
  location?: string;
  highlights: string[];
}

export interface ParsedProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  github_url?: string;
  live_url?: string;
  role?: string;
}

export interface ParsedCertification {
  id: string;
  name: string;
  issuer: string;
  issue_date?: string;
  credential_url?: string;
}

export interface ParsedResumeData {
  full_name?: string;
  contact_email?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  summary?: string;
  education: ParsedEducation[];
  skills: ParsedSkill[];
  experience: ParsedExperience[];
  projects: ParsedProject[];
  certifications: ParsedCertification[];
  achievements: string[];
}

export interface ResumeItem {
  id: string;
  user_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  checksum: string;
  parsed_data?: ParsedResumeData;
  created_at: string;
  updated_at: string;
}

export interface ProfileSyncOptions {
  sync_personal: boolean;
  sync_education: boolean;
  sync_skills: boolean;
  sync_projects: boolean;
  sync_certifications: boolean;
}
