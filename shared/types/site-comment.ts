export type SiteComment = {
  id: number;
  site_id: number;
  user_name: string | null;
  content: string;
  ip: string;
  created_at: string;
};

export type SiteCommentPublic = Omit<SiteComment, 'site_id' | 'ip'>;

export type NewSiteComment = Pick<SiteComment, 'site_id' | 'user_name' | 'content' | 'ip'>;
