export class AdminSiteTagsRepository {
  constructor(private readonly db: D1Database) { }
  
  /** 指定のタグ ID が紐付くサイトの存在チェック (削除時の確認に使用) */
  public async countSitesByTagId(tagId: number): Promise<number> {
    const result = await this.db
      .prepare('SELECT COUNT(*) AS count FROM site_tags WHERE tag_id = ? LIMIT 1')
      .bind(tagId)
      .first<Record<string, number>>();
    return Number(result?.count ?? 0);
  }
}
