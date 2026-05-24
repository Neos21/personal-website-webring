export class AdminSiteIpsRepository {
  constructor(private readonly db: D1Database) { }
  
  // TODO : 全件取得する
  
  /** 指定のサイト ID に紐付く IP アドレス履歴を全て削除する */
  public async deleteBySiteId(siteId: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM site_ips WHERE site_id = ?')
      .bind(siteId)
      .run();
  }
}
