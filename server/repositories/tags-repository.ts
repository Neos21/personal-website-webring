import type { Tag } from '../../shared/types/tag';

export class TagsRepository {
  private db: D1Database;
  
  constructor(db: D1Database) {
    this.db = db;
  }
  
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
  
  public async findOrCreate(name: string): Promise<number> {
    const existing = await this.findByNameCaseInsensitive(name);
    if(existing != null) return existing.id;
    
    return await this.create(name);
  }
}
