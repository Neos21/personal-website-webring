import type { DenyDomain } from '../../shared/types/deny-domain';

export class DenyDomainsRepository {
  constructor(private readonly db: D1Database) { }
  
  public async findAll(): Promise<Array<DenyDomain>> {
    const result = await this.db
      .prepare('SELECT id, domain, created_at FROM deny_domains ORDER BY id DESC')
      .all<DenyDomain>();
    return result.results ?? [];
  }
  
  public async findById(id: number): Promise<DenyDomain | null> {
    return await this.db
      .prepare('SELECT id, domain, created_at FROM deny_domains WHERE id = ? LIMIT 1')
      .bind(id)
      .first<DenyDomain>();
  }
  
  public async findByDomain(domain: string): Promise<DenyDomain | null> {
    return await this.db
      .prepare('SELECT id, domain, created_at FROM deny_domains WHERE domain = ? LIMIT 1')
      .bind(domain.trim().toLowerCase())
      .first<DenyDomain>();
  }
  
  /** `example.example.com` を引数に渡した場合、禁止ドメインに `example.com` があれば合致するように後方一致検索も行う */
  public async findByHostname(hostname: string): Promise<DenyDomain | null> {
    const lowerHostname = hostname.trim().toLowerCase();
    return await this.db
      .prepare('SELECT id, domain, created_at FROM deny_domains WHERE domain = ? OR ? LIKE \'%\' || domain LIMIT 1')
      .bind(lowerHostname, lowerHostname)
      .first<DenyDomain>();
  }
  
  public async create(domain: string): Promise<number> {
    const result = await this.db
      .prepare('INSERT INTO deny_domains (domain) VALUES (?)')
      .bind(domain.trim().toLowerCase())
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
