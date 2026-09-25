export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'JOB_ALERT' | 'INTERVIEW_REMINDER' | 'STATUS_UPDATE' | 'DEADLINE' | 'AGENT_ACTION' | string;
  is_read: boolean;
  link_url?: string;
  created_at: string;
}
