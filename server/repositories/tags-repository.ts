import type { Tag } from '../../shared/types/tag';

export class TagsRepository {
  constructor(private readonly db: D1Database) { }
  
  /** 管理画面向け全件取得 */
  public async findAll(): Promise<Array<Tag>> {
    const result = await this.db
      .prepare('SELECT id, name FROM tags ORDER BY id DESC')
      .all<Tag>();
    return result.results ?? [];
  }
  
  public async findById(id: number): Promise<Tag | null> {
    return await this.db
      .prepare('SELECT id, name FROM tags WHERE id = ? LIMIT 1')
      .bind(id)
      .first<Tag>();
  }
  
  public async findPage(pageSize: number, offset: number): Promise<Array<Tag>> {
    const result = await this.db
      .prepare('SELECT id, name FROM tags ORDER BY id DESC LIMIT ? OFFSET ?')
      .bind(pageSize, offset)
      .all<Tag>();
    return result.results ?? [];
  }
  
  /** タグ1件を大文字小文字区別せず取得する */
  public async findByNameCaseInsensitive(name: string): Promise<Tag | null> {
    return await this.db
      .prepare('SELECT id, name FROM tags WHERE lower(name) = lower(?) LIMIT 1')
      .bind(name)
      .first<Tag>();
  }
  
  public async create(name: string): Promise<number> {
    const result = await this.db
      .prepare('INSERT INTO tags (name) VALUES (?)')
      .bind(name)
      .run();
    return result.meta.last_row_id;
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
  
  public async countSitesByTagId(id: number): Promise<number> {
    const result = await this.db
      .prepare('SELECT COUNT(*) AS count FROM site_tags WHERE tag_id = ?')
      .bind(id)
      .first<Record<string, number>>();
    return Number(result?.count ?? 0);
  }
  
  public async findOrCreate(name: string): Promise<Tag> {
    const existing = await this.findByNameCaseInsensitive(name);
    if(existing != null) return existing;
    
    const id = await this.create(name);
    return { id, name };
  }
}
