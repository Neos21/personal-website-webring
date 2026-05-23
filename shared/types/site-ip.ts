export type SiteIpAdmin = {
  id: number;
  site_id: number;
  is_created: 0 | 1;
  is_self: 0 | 1;
  ip: string;
  created_at: string;
};

export type NewSiteIp = Pick<SiteIpAdmin, 'site_id' | 'is_created' | 'is_self' | 'ip'>;
