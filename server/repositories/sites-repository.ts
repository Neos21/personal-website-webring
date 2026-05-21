import type { NewSite, Site, SiteAuth, SitePublic, SiteUrl, UpdateSite } from '../../shared/types/site';

export class SitesRepository {
  constructor(private readonly db: D1Database) { }
  
  public async findAll(): Promise<Array<Site>> {
    const result = await this.db
      .prepare('SELECT id, is_self, url, site_name, owner_name, description, banner_url, banner_width, banner_height, password_hash, created_at, updated_at, is_deleted FROM sites')
      .all<Site>();
    return result.results ?? [];
  }
  
  public async findActivePage(pageSize: number, offset: number): Promise<Array<SitePublic>> {
    const result = await this.db
      .prepare('SELECT id, is_self, url, site_name, owner_name, description, banner_url, banner_width, banner_height, created_at, updated_at FROM sites WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(pageSize, offset)
      .all<SitePublic>();
    return result.results ?? [];
  }
  
  public async findActiveById(siteId: number): Promise<SitePublic | null> {
    return await this.db
      .prepare('SELECT id, is_self, url, site_name, owner_name, description, banner_url, banner_width, banner_height, created_at, updated_at FROM sites WHERE id = ? AND is_deleted = 0 LIMIT 1')
      .bind(siteId)
      .first<SitePublic>();
  }
  
  public async findAuthById(siteId: number): Promise<SiteAuth | null> {
    return await this.db
      .prepare('SELECT id, is_deleted, password_hash, is_self FROM sites WHERE id = ? LIMIT 1')
      .bind(siteId)
      .first<SiteAuth>();
  }
  
  public async findActiveByExactUrl(url: string, ignoreSiteId?: number): Promise<Pick<Site, 'id'> | null> {
    if(ignoreSiteId == null) {
      return await this.db
        .prepare('SELECT id FROM sites WHERE lower(url) = lower(?)             AND is_deleted = 0 LIMIT 1')
        .bind(url)
        .first<Pick<Site, 'id'>>();
    }
    else {
      return await this.db
        .prepare('SELECT id FROM sites WHERE lower(url) = lower(?) AND id != ? AND is_deleted = 0 LIMIT 1')
        .bind(url, ignoreSiteId)
        .first<Pick<Site, 'id'>>();
    }
  }
  
  public async findActiveUrls(ignoreSiteId?: number): Promise<Array<SiteUrl>> {
    if(ignoreSiteId == null) {
      const result = await this.db
        .prepare('SELECT id, url FROM sites WHERE             is_deleted = 0')
        .all<SiteUrl>();
      return result.results ?? [];
    }
    else {
      const result = await this.db
        .prepare('SELECT id, url FROM sites WHERE id != ? AND is_deleted = 0')
        .bind(ignoreSiteId)
        .all<SiteUrl>();
      return result.results ?? [];
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
      .prepare('UPDATE sites SET is_self = ?, url = ?, site_name = ?, owner_name = ?, description = ?, banner_url = ?, banner_width = ?, banner_height = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(site.is_self, site.url, site.site_name, site.owner_name, site.description, site.banner_url, site.banner_width, site.banner_height, site.password_hash, site.id)
      .run();
  }
  
  /** 論理削除する */
  public async markDeleted(siteId: number): Promise<void> {
    await this.db.prepare('UPDATE sites SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(siteId)
      .run();
  }
}
