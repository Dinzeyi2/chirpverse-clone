
export interface UserSession {
  id: string;
  user_id: string;
  is_online: boolean;
  last_active: string;
  created_at: string;
}

export interface UserSessionInsert {
  user_id: string;
  is_online?: boolean;
  last_active?: string;
}

export interface UserSessionUpdate {
  is_online?: boolean;
  last_active?: string;
}
