export type SiteCommentAdmin = {
  id: number;
  site_id: number;
  user_name: string | null;
  content: string;
  ip: string;
  created_at: string;
};

export type SiteCommentPublic = Omit<SiteCommentAdmin, 'ip'>;

export type NewSiteComment = Pick<SiteCommentAdmin, 'site_id' | 'user_name' | 'content' | 'ip'>;
