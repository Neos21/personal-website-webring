import type { SitesRepository } from '../repositories/sites-repository';
import type { SiteUrlMatch } from '../types/site-url-match';

export class SiteUrlService {
  public async findSiteUrlMatch(sitesRepository: SitesRepository, url: string, ignoreSiteId?: number): Promise<SiteUrlMatch> {
    // 大文字小文字を区別せず完全一致する URL を探す
    const exactMatch = await sitesRepository.findActiveUrlByExactUrl(url, ignoreSiteId);
    if(exactMatch != null && exactMatch.id != null) return { exactMatchId: exactMatch.id, nearMatchId: null };
    
    // URL を全件取得して正規化して類似 URL を探す
    const allSites = await sitesRepository.findActiveUrls(ignoreSiteId);
    const normalizedInput = this.normalizeUrlNearby(url);
    const nearMatch = allSites.find(site => this.normalizeUrlNearby(site.url) === normalizedInput);
    
    return { exactMatchId: null, nearMatchId: nearMatch?.id ?? null };
  }
  
  /** URL 文字列の `www`・`index.html`・末尾スラッシュ等を除去して小文字に統一し正規化する */
  private normalizeUrlNearby(value: string): string {
    const trimmed = value.trim();
    try {
      const url = new URL(trimmed);
      let hostname = url.hostname.toLowerCase();
      if(hostname.startsWith('www.')) hostname = hostname.slice(4);
      
      const pathname = url.pathname.replace((/\/index(?:\.[^/?#]+)?$/i), '').replace((/\/$/), '');
      
      return `${hostname}${pathname}`;
    }
    catch {
      // URL 文字列のハッシュ・末尾スラッシュを除去し、小文字に統一する
      return trimmed.trim().toLowerCase().replace((/#.*$/), '').replace((/\/?$/), '');
    }
  }
}
