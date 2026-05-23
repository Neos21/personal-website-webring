import type { SiteAdmin } from '../../../shared/types/admin/admin-site';

export class AdminSitesRepository {
  constructor(private readonly db: D1Database) { }
  
  /** ページング処理付き一覧 */
  public async findPage(pageSize: number, offset: number): Promise<Array<SiteAdmin>> {
    const result = await this.db
      .prepare('SELECT id, is_self, url, site_name, owner_name, description, banner_url, banner_width, banner_height, password_hash, created_at, updated_at, is_deleted FROM sites ORDER BY id DESC LIMIT ? OFFSET ?')
      .bind(pageSize, offset)
      .all<SiteAdmin>();
    return result.results ?? [];
  }
  
  public async findById(id: number): Promise<SiteAdmin | null> {
    return await this.db
      .prepare('SELECT id, is_self, url, site_name, owner_name, description, banner_url, banner_width, banner_height, password_hash, created_at, updated_at, is_deleted FROM sites WHERE id = ? LIMIT 1')
      .bind(id)
      .first<SiteAdmin>();
  }
  
  public async update(site: SiteAdmin): Promise<void> {
    await this.db
      .prepare('UPDATE sites SET is_self = ?, url = ?, site_name = ?, owner_name = ?, description = ?, banner_url = ?, banner_width = ?, banner_height = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP, is_deleted = ? WHERE id = ?')
      .bind(site.is_self, site.url, site.site_name, site.owner_name, site.description, site.banner_url, site.banner_width, site.banner_height, site.password_hash, site.is_deleted, site.id)
      .run();
  }
  
  public async deleteById(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM sites WHERE id = ?')
      .bind(id)
      .run();
  }
}
