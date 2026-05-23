export type SiteCommentAdmin = {
  id: number;
  site_id: number;
  user_name: string | null;
  content: string;
  ip: string;
  created_at: string;
};
