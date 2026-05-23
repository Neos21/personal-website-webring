export class DenyIpsRepository {
  constructor(private readonly db: D1Database) { }
  
  public async isIpDenied(ip: string): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT 1 FROM deny_ips WHERE ip = ? LIMIT 1')
      .bind(ip)
      .first();
    return result != null;
  }
}
