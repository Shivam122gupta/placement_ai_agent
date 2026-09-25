import { apiClient } from './api';
import { InAppNotification } from '../types/notification';

export const notificationService = {
  listNotifications: async (unreadOnly: boolean = false): Promise<InAppNotification[]> => {
    const response = await apiClient.get<InAppNotification[]>('/notifications', {
      params: { unread_only: unreadOnly },
    });
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<InAppNotification> => {
    const response = await apiClient.patch<InAppNotification>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean; marked_count: number }> => {
    const response = await apiClient.patch<{ success: boolean; marked_count: number }>('/notifications/read-all');
    return response.data;
  },
};
