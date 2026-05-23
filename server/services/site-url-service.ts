import type { SiteNameUrl } from '../../shared/types/site';
import type { SitesRepository } from '../repositories/sites-repository';

export class SiteUrlService {
  /** 大文字小文字を区別せず完全一致する URL を探す */
  public async findExactMatch(sitesRepository: SitesRepository, url: string, ignoreSiteId?: number | null): Promise<SiteNameUrl | null> {
    return await sitesRepository.findActiveNameUrlByExactUrl(url, ignoreSiteId);
  }
  
  /** URL を正規化して類似 URL を探す */
  public async findNearMatch(sitesRepository: SitesRepository, url: string, ignoreSiteId?: number | null): Promise<SiteNameUrl | null> {
    const sites = await sitesRepository.findActiveNameUrls(ignoreSiteId);
    const normalizedUrl = this.normalizeUrl(url);
    return sites.find(site => this.normalizeUrl(site.url) === normalizedUrl) ?? null;
  }
  
  /** URL 文字列の `www`・`index.html`・末尾スラッシュ等を除去して小文字に統一し正規化する */
  private normalizeUrl(url: string): string {
    const trimmedUrl = url.trim();
    try {
      const url = new URL(trimmedUrl);
      let hostname = url.hostname.toLowerCase();
      if(hostname.startsWith('www.')) hostname = hostname.slice(4);
      
      const pathname = url.pathname.replace((/\/index(?:\.[^/?#]+)?$/i), '').replace((/\/$/), '');
      
      return `${hostname}${pathname}`;
    }
    catch {
      // URL 文字列のハッシュ・末尾スラッシュを除去し、小文字に統一する
      return trimmedUrl.trim().toLowerCase().replace((/#.*$/), '').replace((/\/?$/), '');
    }
  }
}
