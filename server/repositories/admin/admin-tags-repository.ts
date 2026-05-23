import type { Tag } from '../../../shared/types/tag';

export class AdminTagsRepository {
  constructor(private readonly db: D1Database) { }
  
  /** ページング処理付き一覧 */
  public async findPage(pageSize: number, offset: number): Promise<Array<Tag>> {
    const result = await this.db
      .prepare('SELECT id, name FROM tags ORDER BY id DESC LIMIT ? OFFSET ?')
      .bind(pageSize, offset)
      .all<Tag>();
    return result.results ?? [];
  }
  
  /** 削除時の存在チェック用 */
  public async findById(id: number): Promise<Tag | null> {
    return await this.db
      .prepare('SELECT id, name FROM tags WHERE id = ? LIMIT 1')
      .bind(id)
      .first<Tag>();
  }
  
  public async updateById(id: number, name: string): Promise<void> {
    await this.db
      .prepare('UPDATE tags SET name = ? WHERE id = ?')
      .bind(name, id)
      .run();
  }
  
  public async deleteById(id: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM tags WHERE id = ?')
      .bind(id)
      .run();
  }
}
