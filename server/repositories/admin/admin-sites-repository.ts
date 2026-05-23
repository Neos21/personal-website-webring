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
  
  // TODO : 管理画面での全項目更新
  
  public async deleteById(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM sites WHERE id = ?')
      .bind(id)
      .run();
  }
}
