export type SiteIpAdmin = {
  id: number;
  site_id: number;
  is_created: number;
  is_self: number;
  ip: string;
  created_at: string;
};

export type NewSiteIp = Pick<SiteIpAdmin, 'site_id' | 'is_created' | 'is_self' | 'ip'>;
