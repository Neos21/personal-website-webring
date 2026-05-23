export class SiteTagsRepository {
  constructor(private readonly db: D1Database) { }
  
  /** サイト ID とタグ ID を紐付ける */
  public async attach(siteId: number, tagId: number): Promise<void> {
    await this.db
      .prepare('INSERT OR IGNORE INTO site_tags (site_id, tag_id) VALUES (?, ?)')
      .bind(siteId, tagId)
      .run();
  }
  
  // TODO : これ Service クラスがやるべきか
  /** 複数のタグ ID を指定のサイト ID に紐付ける */
  public async attachTagIds(siteId: number, tagIds: Array<number>): Promise<void> {
    for(const tagId of tagIds) await this.attach(siteId, tagId);
  }
  
  /** 指定のサイト ID に紐付くタグを全て削除する */
  public async deleteBySiteId(siteId: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM site_tags WHERE site_id = ?')
      .bind(siteId)
      .run();
  }
  
  // TODO : これ Service クラスがやるべきか
  /** 指定のサイト ID に紐付くタグ ID を更新する (一旦全削除 → 新規追加とする) */
  public async replaceTagIds(siteId: number, tagIds: Array<number>): Promise<void> {
    await this.deleteBySiteId(siteId);
    await this.attachTagIds(siteId, tagIds);
  }
}
