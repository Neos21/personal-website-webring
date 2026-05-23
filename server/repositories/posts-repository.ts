import type { NewPost, PostPublic } from '../../shared/types/post';

export class PostsRepository {
  constructor(private readonly db: D1Database) { }
  
  /** ページング処理付き一覧 */
  public async findPage(pageSize: number, offset: number, siteId: number | null): Promise<Array<PostPublic>> {
    if(siteId == null) {
      const result = await this.db
        .prepare('SELECT id, site_id, user_name, content, is_admin, created_at FROM posts                   ORDER BY id DESC LIMIT ? OFFSET ?')
        .bind(pageSize, offset)
        .all<PostPublic>();
      return result.results ?? [];
    }
    else {
      const result = await this.db
        .prepare('SELECT id, site_id, user_name, content, is_admin, created_at FROM posts WHERE site_id = ? ORDER BY id DESC LIMIT ? OFFSET ?')
        .bind(siteId, pageSize, offset)
        .all<PostPublic>();
      return result.results ?? [];
    }
  }
  
  /** 一般ユーザ投稿 */
  public async create(post: NewPost): Promise<number> {
    const result = await this.db
      .prepare('INSERT INTO posts (site_id, user_name, content, ip, is_admin, created_at) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)')
      .bind(post.site_id, post.user_name, post.content, post.ip)
      .run();
    return result.meta.last_row_id;
  }
}
