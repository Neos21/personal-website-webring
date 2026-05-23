export type PostAdmin = {
  id: number;
  site_id: number | null | undefined;
  user_name: string | null | undefined;
  content: string;
  ip: string;
  is_admin: 0 | 1;
  created_at: string;
};
