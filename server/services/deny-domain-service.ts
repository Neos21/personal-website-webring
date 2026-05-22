import { DenyDomainsRepository } from '../repositories/deny-domains-repository';

export class DenyDomainService {
  public async findMatchedDomain(denyDomainsRepository: DenyDomainsRepository, url: string): Promise<string | null> {
    const hostname = this.getHostname(url);
    if(hostname == null) return null;
    
    const matchedDomain = await denyDomainsRepository.findByHostname(hostname);
    if(matchedDomain == null) return null;
    
    return matchedDomain.domain;
  }
  
  private getHostname(url: string): string | null {
    try {
      // `https://` などのプロトコルがないとエラーになる
      // ` https://example.com/ ` のように前後にスペースがあっても無視して解釈される
      return new URL(url).hostname.toLowerCase();
    }
    catch {
      return null;
    }
  }
}
