export type SiteIpAdmin = {
  id: number;
  site_id: number;
  is_created: 0 | 1;
  is_self: 0 | 1;
  ip: string;
  created_at: string;
};
