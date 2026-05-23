import type { SiteCommentAdmin } from './admin/admin-site-comment';

export type SiteCommentPublic = Omit<SiteCommentAdmin, 'ip'>;

export type NewSiteComment = Pick<SiteCommentAdmin, 'site_id' | 'user_name' | 'content' | 'ip'>;
