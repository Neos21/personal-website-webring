import type { PostAdmin } from '../../../shared/types/admin/admin-post';
import type { NewPost } from '../../../shared/types/post';

export class AdminPostsRepository {
  constructor(private readonly db: D1Database) { }
  
  /** ページング処理付き一覧 */
  public async findPage(pageSize: number, offset: number, siteId: number | null): Promise<Array<PostAdmin>> {
    if(siteId == null) {
      const result = await this.db
        .prepare('SELECT id, site_id, user_name, content, ip, is_admin, created_at FROM posts                   ORDER BY id DESC LIMIT ? OFFSET ?')
        .bind(pageSize, offset)
        .all<PostAdmin>();
      return result.results ?? [];
    }
    else {
      const result = await this.db
        .prepare('SELECT id, site_id, user_name, content, ip, is_admin, created_at FROM posts WHERE site_id = ? ORDER BY id DESC LIMIT ? OFFSET ?')
        .bind(siteId, pageSize, offset)
        .all<PostAdmin>();
      return result.results ?? [];
    }
  }
  
  public async findById(id: number): Promise<PostAdmin | null> {
    return await this.db
      .prepare('SELECT id, site_id, user_name, content, ip, is_admin, created_at FROM posts WHERE site_id = ? LIMIT 1')
      .bind(id)
      .first<PostAdmin>();
  }
  
  /** リングマスター投稿 */
  public async create(post: NewPost): Promise<number> {
    const result = await this.db
      .prepare('INSERT INTO posts (site_id, user_name, content, ip, is_admin, created_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)')
      .bind(post.site_id, post.user_name, post.content, post.ip)
      .run();
    return result.meta.last_row_id;
  }
  
  public async update(post: Omit<PostAdmin, 'ip' | 'created_at'>): Promise<void> {
    await this.db
      .prepare('UPDATE posts SET site_id = ?, user_name = ?, content = ?, is_admin = ? WHERE id = ?')
      .bind(post.site_id, post.user_name, post.content, post.is_admin, post.id)
      .run();
  }
  
  public async deleteById(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM posts WHERE id = ?')
      .bind(id)
      .run();
  }
}
