export type SiteCommentAdmin = {
  id: number;
  site_id: number;
  user_name: string | null | undefined;
  content: string;
  ip: string;
  created_at: string;
};
