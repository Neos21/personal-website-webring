import type { SiteUrl } from '../../shared/types/site';

export class WebringRepository {
  constructor(private readonly db: D1Database) { }
  
  public async getNextSite(id: number): Promise<SiteUrl | null> {
    // 現在の ID より大きい最初のサイトを取得する
    let site = await this.db
      .prepare('SELECT id, url FROM sites WHERE id > ? AND is_deleted = 0 ORDER BY id ASC LIMIT 1')
      .bind(id)
      .first<SiteUrl>();
    
    // 見つからない場合は先頭に戻る
    if(site == null) site = await this.db
      .prepare('SELECT id, url FROM sites WHERE id != ? AND is_deleted = 0 ORDER BY id ASC LIMIT 1')
      .bind(id)
      .first<SiteUrl>();
    
    return site;
  }
  
  public async getPrevSite(id: number): Promise<SiteUrl | null> {
    // 現在の ID より小さい最後のサイトを取得する
    let site = await this.db
      .prepare('SELECT id, url FROM sites WHERE id < ? AND is_deleted = 0 ORDER BY id DESC LIMIT 1')
      .bind(id)
      .first<SiteUrl>();
    
    // 見つからない場合は末尾に戻る
    if(site == null) site = await this.db
      .prepare('SELECT id, url FROM sites WHERE id != ? AND is_deleted = 0 ORDER BY id DESC LIMIT 1')
      .bind(id)
      .first<SiteUrl>();
    
    return site;
  }
  
  public async getRandomSite(id: number): Promise<SiteUrl | null> {
    return await this.db
      .prepare('SELECT id, url FROM sites WHERE id != ? AND is_deleted = 0 ORDER BY RANDOM() LIMIT 1')
      .bind(id)
      .first<SiteUrl>();
  }
}
