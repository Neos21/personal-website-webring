import { convertIpV6AddressTo64Bit } from '../../helpers/convert-ip-v6-address-to-64-bit';

import type { DenyIpAdmin } from '../../../shared/types/admin/admin-deny-ip';

export class AdminDenyIpsRepository {
  constructor(private readonly db: D1Database) { }
  
  public async findAll(): Promise<Array<DenyIpAdmin>> {
    const result = await this.db
      .prepare('SELECT id, ip, created_at FROM deny_ips ORDER BY id DESC')
      .all<DenyIpAdmin>();
    return result.results ?? [];
  }
  
  public async findById(id: number): Promise<DenyIpAdmin | null> {
    return await this.db
      .prepare('SELECT id, ip, created_at FROM deny_ips WHERE id = ? LIMIT 1')
      .bind(id)
      .first<DenyIpAdmin>();
  }
  
  public async create(ip: string): Promise<number> {
    const trimmedIp = ip.trim();
    const normalizedIp = trimmedIp.includes(':') ? convertIpV6AddressTo64Bit(trimmedIp) : trimmedIp;
    // TODO : ↑ この処理はココでやりたくない
    const result = await this.db
      .prepare('INSERT INTO deny_ips (ip) VALUES (?)')
      .bind(normalizedIp)
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
