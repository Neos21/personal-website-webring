import type { SiteCommentAdmin } from '../../../shared/types/admin/admin-site-comment';

export class AdminSiteCommentsRepository {
  constructor(private readonly db: D1Database) { }
  
  /** ページング処理付き一覧 */
  public async findPage(pageSize: number, offset: number): Promise<Array<SiteCommentAdmin>> {
    const result = await this.db
      .prepare('SELECT id, site_id, user_name, content, ip, created_at FROM site_comments ORDER BY id DESC LIMIT ? OFFSET ?')
      .bind(pageSize, offset)
      .all<SiteCommentAdmin>();
    return result.results ?? [];
  }
  
  public async findById(id: number): Promise<SiteCommentAdmin | null> {
    return await this.db
      .prepare('SELECT id, site_id, user_name, content, ip, created_at FROM site_comments WHERE id = ? LIMIT 1')
      .bind(id)
      .first<SiteCommentAdmin>();
  }
  
  public async update(siteComment: Omit<SiteCommentAdmin, 'site_id' | 'ip' | 'created_at'>): Promise<void> {
    await this.db
      .prepare('UPDATE site_comments SET user_name = ?, content = ? WHERE id = ?')
      .bind(siteComment.user_name, siteComment.content, siteComment.id)
      .run();
  }
  
  public async deleteById(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM site_comments WHERE id = ?')
      .bind(id)
      .run();
  }
  
  /** サイトに紐付くコメントを全て削除する */
  public async deleteBySiteId(siteId: number): Promise<void> {
    await this.db.prepare('DELETE FROM site_comments WHERE site_id = ?')
      .bind(siteId)
      .run();
  }
}
