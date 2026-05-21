import { normalizeUrlNearby } from '../helpers/normalize-url';

import type { SitesRepository } from '../repositories/sites-repository';
import type { SiteUrlMatch } from '../types/site-url-match';

export class SiteUrlService {
  public async findSiteUrlMatch(sitesRepository: SitesRepository, url: string, ignoreSiteId?: number): Promise<SiteUrlMatch> {
    const exactMatch = await sitesRepository.findActiveByExactUrl(url, ignoreSiteId);
    if(exactMatch != null && exactMatch.id != null) return { exactMatchId: exactMatch.id, nearMatchId: null };
    
    const allSites = await sitesRepository.findActiveUrls(ignoreSiteId);
    const normalizedInput = normalizeUrlNearby(url);
    const nearMatch = allSites.find(site => normalizeUrlNearby(site.url) === normalizedInput);
    
    return { exactMatchId: null, nearMatchId: nearMatch?.id ?? null };
  }
}
