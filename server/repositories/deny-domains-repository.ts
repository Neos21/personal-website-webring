import type { DenyDomainPublic } from '../../shared/types/deny-domain';

export class DenyDomainsRepository {
  constructor(private readonly db: D1Database) { }
  
  /** `example.example.com` を引数に渡した場合、禁止ドメインに `example.com` があれば合致するように後方一致検索も行う */
  public async findByHostname(lowerHostname: string): Promise<DenyDomainPublic | null> {
    return await this.db
      .prepare('SELECT id, domain, created_at FROM deny_domains WHERE domain = ? OR ? LIKE \'%.\' || domain LIMIT 1')
      .bind(lowerHostname, lowerHostname)
      .first<DenyDomainPublic>();
  }
}
