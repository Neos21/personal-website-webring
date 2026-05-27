import type { DenyDomainAdmin } from '../../../shared/types/admin/admin-deny-domain';

export class AdminDenyDomainsRepository {
  constructor(private readonly db: D1Database) { }
  
  public async findAll(): Promise<Array<DenyDomainAdmin>> {
    const result = await this.db
      .prepare('SELECT id, domain, created_at FROM deny_domains ORDER BY id DESC')
      .all<DenyDomainAdmin>();
    return result.results ?? [];
  }
  
  /** 削除時の存在チェック用 */
  public async findById(id: number): Promise<DenyDomainAdmin | null> {
    return await this.db
      .prepare('SELECT id, domain, created_at FROM deny_domains WHERE id = ? LIMIT 1')
      .bind(id)
      .first<DenyDomainAdmin>();
  }
  
  /** 登録時の重複チェック用・`DenyDomainsRepository#findByHostname()` と比べて完全一致にしてある */
  public async findByDomain(domain: string): Promise<DenyDomainAdmin | null> {
    return await this.db
      .prepare('SELECT id, domain, created_at FROM deny_domains WHERE domain = ? LIMIT 1')
      .bind(domain)
      .first<DenyDomainAdmin>();
  }
  
  public async create(domain: string): Promise<number> {
    const result = await this.db
      .prepare('INSERT INTO deny_domains (domain, created_at) VALUES (?, CURRENT_TIMESTAMP)')
      .bind(domain)
      .run();
    return result.meta.last_row_id;
  }
  
  public async deleteById(id: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM deny_domains WHERE id = ?')
      .bind(id)
      .run();
  }
}
