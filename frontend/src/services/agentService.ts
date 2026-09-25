import { apiClient } from './api';
import {
  AgentChatRequest,
  AgentChatResponse,
  ActionConfirmationRequest,
  AgentHistoryItem,
} from '../types/agent';
import { StandardResponse } from '../types/common';

export const agentService = {
  chat: async (payload: AgentChatRequest): Promise<AgentChatResponse> => {
    const res = await apiClient.post<StandardResponse<AgentChatResponse>>('/agent/chat', payload);
    return res.data.data!;
  },

  confirmAction: async (payload: ActionConfirmationRequest): Promise<AgentChatResponse> => {
    const res = await apiClient.post<StandardResponse<AgentChatResponse>>('/agent/confirm-action', payload);
    return res.data.data!;
  },

  getHistory: async (): Promise<AgentHistoryItem[]> => {
    const res = await apiClient.get<StandardResponse<AgentHistoryItem[]>>('/agent/history');
    return res.data.data!;
  },
};
