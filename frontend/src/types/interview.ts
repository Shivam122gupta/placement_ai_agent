export interface AnswerEvaluation {
  technical_score: number;
  depth_score: number;
  communication_score: number;
  key_strengths: string[];
  missing_concepts: string[];
  actionable_feedback: string;
  ideal_sample_response: string;
}

export interface InterviewQuestion {
  question_id: string;
  order_num: number;
  category: 'TECHNICAL' | 'PROJECT_DEEP_DIVE' | 'SYSTEM_DESIGN' | 'BEHAVIORAL_STAR' | string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | string;
  question: string;
  context_or_scenario?: string;
  expected_concepts: string[];
  candidate_answer?: string;
  evaluation?: AnswerEvaluation;
}

export interface MockInterview {
  id: string;
  user_id: string;
  job_id?: string;
  title: string;
  target_role: string;
  experience_level: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | string;
  current_question_index: number;
  total_questions: number;
  overall_score?: number;
  technical_score_avg?: number;
  communication_score_avg?: number;
  strengths: string[];
  improvement_areas: string[];
  summary_feedback?: string;
  questions: InterviewQuestion[];
  created_at: string;
  completed_at?: string;
}

export interface MockInterviewSummaryItem {
  id: string;
  title: string;
  target_role: string;
  status: string;
  overall_score?: number;
  total_questions: number;
  created_at: string;
}

export interface GenerateInterviewRequest {
  role?: string;
  experience_level?: string;
  job_id?: string;
  num_questions?: number;
}

export interface SubmitAnswerRequest {
  question_id: string;
  candidate_answer: string;
}

export interface SubmitAnswerResponse {
  interview_id: string;
  question_id: string;
  evaluation: AnswerEvaluation;
  current_question_index: number;
  total_questions: number;
  is_completed: boolean;
}
