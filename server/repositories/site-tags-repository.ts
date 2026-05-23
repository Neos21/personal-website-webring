export class SiteTagsRepository {
  constructor(private readonly db: D1Database) { }
  
  /** サイト ID とタグ ID を紐付ける */
  public async attach(siteId: number, tagId: number): Promise<void> {
    await this.db
      .prepare('INSERT OR IGNORE INTO site_tags (site_id, tag_id) VALUES (?, ?)')
      .bind(siteId, tagId)
      .run();
  }
  
  /** 指定のサイト ID に紐付くタグを全て削除する */
  public async deleteBySiteId(siteId: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM site_tags WHERE site_id = ?')
      .bind(siteId)
      .run();
  }
}
