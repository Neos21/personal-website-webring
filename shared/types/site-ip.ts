import type { SiteIpAdmin } from './admin/site-ip';

export type NewSiteIp = Pick<SiteIpAdmin, 'site_id' | 'is_created' | 'is_self' | 'ip'>;
