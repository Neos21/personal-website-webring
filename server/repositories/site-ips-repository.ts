import type { NewSiteIp } from '../../shared/types/site-ip';

export class SiteIpsRepository {
  private db: D1Database;
  
  constructor(db: D1Database) {
    this.db = db;
  }
  
  public async create(siteIp: NewSiteIp): Promise<number> {
    const result = await this.db
      .prepare('INSERT INTO site_ips (site_id, is_created, is_self, ip) VALUES (?, ?, ?, ?)')
      .bind(siteIp.site_id, siteIp.is_created, siteIp.is_self, siteIp.ip)
      .run();
    return result.meta.last_row_id;
  }
}
