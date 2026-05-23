import type { Tag } from '../tag';

export type SiteAdmin = {
  id: number;
  is_self: 0 | 1;
  url: string;
  site_name: string;
  owner_name: string | null;
  description: string | null;
  banner_url: string | null;
  banner_width: number | null;
  banner_height: number | null;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: 0 | 1;
};

export type SiteAdminWithTags = SiteAdmin & { tags: Array<Tag>; };
