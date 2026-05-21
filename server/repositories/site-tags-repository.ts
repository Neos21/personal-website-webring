import { TagsRepository } from './tags-repository';
import { isEmpty } from '../../shared/helpers/is-empty';


export class SiteTagsRepository {
  private db: D1Database;
  
  private tagsRepository: TagsRepository;
  
  constructor(db: D1Database) {
    this.db = db;
    this.tagsRepository = new TagsRepository(db);
  }
  
  public async attach(siteId: number, tagId: number): Promise<void> {
    await this.db
      .prepare('INSERT OR IGNORE INTO site_tags (site_id, tag_id) VALUES (?, ?)')
      .bind(siteId, tagId)
      .run();
  }
  
  public async attachNames(siteId: number, tags: Array<string>): Promise<void> {
    const uniqueTags = [...new Map(tags.map(tag => [tag.trim().toLowerCase(), tag.trim()])).values()];
    for(const tag of uniqueTags) {
      if(isEmpty(tag)) continue;
      
      const tagId = await this.tagsRepository.findOrCreate(tag);
      await this.attach(siteId, tagId);
    }
  }
  
  public async replaceNames(siteId: number, tags: Array<string>): Promise<void> {
    await this.db
      .prepare('DELETE FROM site_tags WHERE site_id = ?')
      .bind(siteId)
      .run();
    await this.attachNames(siteId, tags);
  }
}
