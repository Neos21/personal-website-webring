export type Site = {
  id: number;
  is_self: number;
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
  is_deleted: number;
};

export type SitePublic = Omit<Site, 'password_hash' | 'is_deleted'>;

export type SiteAuth = Pick<Site, 'id' | 'is_deleted' | 'password_hash' | 'is_self'>;

export type SiteUrl = Pick<Site, 'id' | 'url'>;

export type NewSite = Pick<Site, 'is_self' | 'url' | 'site_name' | 'owner_name' | 'description' | 'banner_url' | 'banner_width' | 'banner_height' | 'password_hash'>;

export type UpdateSite = NewSite & { id: number; };
