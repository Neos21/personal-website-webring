export type PostAdmin = {
  id: number;
  site_id: number | null;
  user_name: string | null;
  content: string;
  ip: string;
  is_admin: 0 | 1;
  created_at: string;
};
