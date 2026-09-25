import { apiClient } from './api';
import {
  MemorySearchRequest,
  MemorySearchResponse,
  CandidateNoteCreate,
  CandidateNoteResponse,
  MemoryStatsResponse,
  MemorySyncResponse,
} from '../types/memory';

export const memoryService = {
  syncMemory: async (): Promise<MemorySyncResponse> => {
    const response = await apiClient.post<MemorySyncResponse>('/memory/sync');
    return response.data;
  },

  searchMemory: async (payload: MemorySearchRequest): Promise<MemorySearchResponse> => {
    const response = await apiClient.post<MemorySearchResponse>('/memory/search', payload);
    return response.data;
  },

  addNote: async (payload: CandidateNoteCreate): Promise<CandidateNoteResponse> => {
    const response = await apiClient.post<CandidateNoteResponse>('/memory/notes', payload);
    return response.data;
  },

  getStats: async (): Promise<MemoryStatsResponse> => {
    const response = await apiClient.get<MemoryStatsResponse>('/memory/stats');
    return response.data;
  },

  deleteChunk: async (chunkId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/memory/chunks/${chunkId}`);
    return response.data;
  },

  clearAllMemory: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>('/memory/clear');
    return response.data;
  },
};

