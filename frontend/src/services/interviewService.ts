import { apiClient } from './api';
import {
  MockInterview,
  MockInterviewSummaryItem,
  GenerateInterviewRequest,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from '../types/interview';

export const interviewService = {
  generateInterview: async (payload: GenerateInterviewRequest): Promise<MockInterview> => {
    const response = await apiClient.post<MockInterview>('/interviews/generate', payload);
    return response.data;
  },

  listInterviews: async (): Promise<MockInterviewSummaryItem[]> => {
    const response = await apiClient.get<MockInterviewSummaryItem[]>('/interviews');
    return response.data;
  },

  getInterview: async (interviewId: string): Promise<MockInterview> => {
    const response = await apiClient.get<MockInterview>(`/interviews/${interviewId}`);
    return response.data;
  },

  submitAnswer: async (interviewId: string, payload: SubmitAnswerRequest): Promise<SubmitAnswerResponse> => {
    const response = await apiClient.post<SubmitAnswerResponse>(`/interviews/${interviewId}/answers`, payload);
    return response.data;
  },

  completeInterview: async (interviewId: string): Promise<MockInterview> => {
    const response = await apiClient.post<MockInterview>(`/interviews/${interviewId}/complete`);
    return response.data;
  },

  deleteInterview: async (interviewId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/interviews/${interviewId}`);
    return response.data;
  },
};
