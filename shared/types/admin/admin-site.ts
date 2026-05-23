import type { Tag } from '../tag';

export type SiteAdmin = {
  id: number;
  is_self: 0 | 1;
  url: string;
  site_name: string;
  owner_name: string | null | undefined;
  description: string | null | undefined;
  banner_url: string | null | undefined;
  banner_width: number | null | undefined;
  banner_height: number | null | undefined;
  password_hash: string | null | undefined;
  created_at: string;
  updated_at: string;
  is_deleted: 0 | 1;
};

export type SiteAdminWithTags = SiteAdmin & { tags: Array<Tag>; };
