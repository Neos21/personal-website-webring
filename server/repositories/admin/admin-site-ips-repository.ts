import type { SiteIpAdmin } from '../../../shared/types/admin/admin-site-ip';

export class AdminSiteIpsRepository {
  constructor(private readonly db: D1Database) { }
  
  /** ページング処理付き一覧 */
  public async findPage(pageSize: number, offset: number): Promise<Array<SiteIpAdmin>> {
    const result = await this.db
      .prepare('SELECT id, site_id, is_created, is_self, ip, created_at FROM site_ips ORDER BY id DESC LIMIT ? OFFSET ?')
      .bind(pageSize, offset)
      .all<SiteIpAdmin>();
    return result.results ?? [];
  }
  
  /** 指定のサイト ID に紐付く IP アドレス履歴を全て削除する */
  public async deleteBySiteId(siteId: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM site_ips WHERE site_id = ?')
      .bind(siteId)
      .run();
  }
}
