import type { DenyIp } from '../../shared/types/deny-ip';

export class DenyIpsRepository {
  constructor(private readonly db: D1Database) { }
  
  public async findAll(): Promise<Array<DenyIp>> {
    const result = await this.db
      .prepare('SELECT id, ip, created_at FROM deny_ips ORDER BY id DESC')
      .all<DenyIp>();
    return result.results ?? [];
  }
  
  public async findById(id: number): Promise<DenyIp | null> {
    return await this.db
      .prepare('SELECT id, ip, created_at FROM deny_ips WHERE id = ? LIMIT 1')
      .bind(id)
      .first<DenyIp>();
  }
  
  public async isIpDenied(ip: string): Promise<boolean> {
    const result = await this.db
      .prepare('SELECT 1 FROM deny_ips WHERE ip = ? LIMIT 1')
      .bind(ip)
      .first();
    return result != null;
  }
  
  public async create(ip: string): Promise<number> {
    const result = await this.db
      .prepare('INSERT INTO deny_ips (ip) VALUES (?)')
      .bind(ip)
      .run();
    return result.meta.last_row_id;
  }
  
  public async deleteById(id: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM deny_ips WHERE id = ?')
      .bind(id)
      .run();
  }
}
