import { convertIpV6AddressTo64Bit } from '../helpers/convert-ip-v6-address-to-64-bit';

export class DenyIpsRepository {
  constructor(private readonly db: D1Database) { }
  
  public async isIpDenied(ip: string): Promise<boolean> {
    const trimmedIp = ip.trim();
    const normalizedIp = trimmedIp.includes(':') ? convertIpV6AddressTo64Bit(trimmedIp) : trimmedIp;
    // TODO : ↑ この処理はココでやりたくない
    const result = await this.db
      .prepare('SELECT 1 FROM deny_ips WHERE ip = ? LIMIT 1')
      .bind(normalizedIp)
      .first();
    return result != null;
  }
}
