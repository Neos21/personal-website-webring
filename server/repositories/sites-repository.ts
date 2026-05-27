import type { NewSite, SiteForAuth, SiteNameUrl, SitePublic, UpdateSite } from '../../shared/types/site';

export class SitesRepository {
  constructor(private readonly db: D1Database) { }
  
  /** ページング処理付き一覧 */
  public async findActivePage(pageSize: number, offset: number): Promise<Array<SitePublic>> {
    const result = await this.db
      .prepare('SELECT id, is_self, url, site_name, owner_name, description, banner_url, banner_width, banner_height, created_at, updated_at FROM sites WHERE is_deleted = 0 ORDER BY id DESC LIMIT ? OFFSET ?')
      .bind(pageSize, offset)
      .all<SitePublic>();
    return result.results ?? [];
  }
  
  /** 1件取得用・関連リソース操作時の存在チェック用 */
  public async findActiveById(id: number): Promise<SitePublic | null> {
    return await this.db
      .prepare('SELECT id, is_self, url, site_name, owner_name, description, banner_url, banner_width, banner_height, created_at, updated_at FROM sites WHERE id = ? AND is_deleted = 0 LIMIT 1')
      .bind(id)
      .first<SitePublic>();
  }
  
  public async findAuthById(id: number): Promise<SiteForAuth | null> {
    return await this.db
      .prepare('SELECT id, is_self, password_hash, is_deleted FROM sites WHERE id = ? LIMIT 1')
      .bind(id)
      .first<SiteForAuth>();
  }
  
  /** 完全一致 URL の検索用・サイト情報を含む */
  public async findActiveNameUrlByExactUrl(lowerUrl: string, ignoreId?: number | null): Promise<SiteNameUrl | null> {
    if(ignoreId == null) {
      return await this.db
        .prepare('SELECT id, url, site_name FROM sites WHERE lower(url) = ?             AND is_deleted = 0 LIMIT 1')
        .bind(lowerUrl)
        .first<SiteNameUrl>();
    }
    else {
      return await this.db
        .prepare('SELECT id, url, site_name FROM sites WHERE lower(url) = ? AND id != ? AND is_deleted = 0 LIMIT 1')
        .bind(lowerUrl, ignoreId)
        .first<SiteNameUrl>();
    }
  }
  
  /** 類似 URL チェック用・サイト情報を含む */
  public async findActiveNameUrls(ignoreId?: number | null): Promise<Array<SiteNameUrl>> {
    if(ignoreId == null) {
      const result = await this.db
        .prepare('SELECT id, url, site_name FROM sites WHERE             is_deleted = 0')
        .all<SiteNameUrl>();
      return result.results ?? [];
    }
    else {
      const result = await this.db
        .prepare('SELECT id, url, site_name FROM sites WHERE id != ? AND is_deleted = 0')
        .bind(ignoreId)
        .all<SiteNameUrl>();
      return result.results ?? [];
    }
  }
  
  public async findNext(id: number): Promise<SiteNameUrl | null> {
    // 現在の ID より大きい最初のサイトを取得する
    let site = await this.db
      .prepare('SELECT id, url, site_name FROM sites WHERE id >  ? AND is_deleted = 0 ORDER BY id ASC LIMIT 1')
      .bind(id)
      .first<SiteNameUrl>();
    // 見つからない場合は先頭へ戻る
    if(site == null) site = await this.db
      .prepare('SELECT id, url, site_name FROM sites WHERE id != ? AND is_deleted = 0 ORDER BY id ASC LIMIT 1')
      .bind(id)
      .first<SiteNameUrl>();
    return site;
  }
  
  public async findPrev(id: number): Promise<SiteNameUrl | null> {
    // 現在の ID より小さい最後のサイトを取得する
    let site = await this.db
      .prepare('SELECT id, url, site_name FROM sites WHERE id <  ? AND is_deleted = 0 ORDER BY id DESC LIMIT 1')
      .bind(id)
      .first<SiteNameUrl>();
    // 見つからない場合は末尾へ戻る
    if(site == null) site = await this.db
      .prepare('SELECT id, url, site_name FROM sites WHERE id != ? AND is_deleted = 0 ORDER BY id DESC LIMIT 1')
      .bind(id)
      .first<SiteNameUrl>();
    return site;
  }
  
  public async findRandom(id: number | null): Promise<SiteNameUrl | null> {
    if(id == null) {
      return await this.db
        .prepare('SELECT id, url, site_name FROM sites WHERE             is_deleted = 0 ORDER BY RANDOM() LIMIT 1')
        .first<SiteNameUrl>();
    }
    else {
      return await this.db
        .prepare('SELECT id, url, site_name FROM sites WHERE id != ? AND is_deleted = 0 ORDER BY RANDOM() LIMIT 1')
        .bind(id)
        .first<SiteNameUrl>();
    }
  }
  
  public async create(site: NewSite): Promise<number> {
    const result = await this.db
      .prepare('INSERT INTO sites (is_self, url, site_name, owner_name, description, banner_url, banner_width, banner_height, password_hash, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)')
      .bind(site.is_self, site.url, site.site_name, site.owner_name, site.description, site.banner_url, site.banner_width, site.banner_height, site.password_hash)
      .run();
    return result.meta.last_row_id;
  }
  
  public async update(site: UpdateSite): Promise<void> {
    await this.db
      .prepare('UPDATE sites SET is_self = 1, url = ?, site_name = ?, owner_name = ?, description = ?, banner_url = ?, banner_width = ?, banner_height = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(site.url, site.site_name, site.owner_name, site.description, site.banner_url, site.banner_width, site.banner_height, site.password_hash, site.id)
      .run();
  }
  
  /** 論理削除する */
  public async markDeleted(id: number): Promise<void> {
    await this.db.prepare('UPDATE sites SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(id)
      .run();
  }
}
