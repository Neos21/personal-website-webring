import type { NewSiteComment, SiteCommentPublic } from '../../shared/types/site-comment';

export class SiteCommentsRepository {
  constructor(private readonly db: D1Database) { }
  
  public async findBySiteId(siteId: number): Promise<Array<SiteCommentPublic>> {
    const result = await this.db
      .prepare('SELECT id, user_name, content, created_at FROM site_comments WHERE site_id = ? ORDER BY created_at DESC')
      .bind(siteId)
      .all<SiteCommentPublic>();
    return result.results ?? [];
  }
  
  public async create(siteComment: NewSiteComment): Promise<number> {
    const result = await this.db
      .prepare('INSERT INTO site_comments (site_id, user_name, content, ip) VALUES (?, ?, ?, ?)')
      .bind(siteComment.site_id, siteComment.user_name, siteComment.content, siteComment.ip)
      .run();
    return result.meta.last_row_id;
  }
}
