import { isEmpty } from '../../shared/helpers/is-empty';

import type { Tag } from '../../shared/types/tag';
import type { SiteTagsRepository } from '../repositories/site-tags-repository';
import type { TagsRepository } from '../repositories/tags-repository';

export class SiteTagService {
  /** タグを一括追加する (指定のタグを存在チェックしながら追加する) */
  public async normalizeTags(tagsRepository: TagsRepository, tags: Array<string>): Promise<Array<Tag>> {
    // Map に投入される Value は「後勝ち」になるので、`tags = ['Game', 'game', 'GAME']` だった場合 `Map.get('game') → 'GAME'` となる
    // DB 登録済のタグの場合は `findOrCreate()` 内で大文字小文字を区別せず取得するので、DB 登録値が `Game` だったらそれが `normalizeTags` に入る
    const uniqueTags = [...new Map(tags.map(tag => [tag.trim().toLowerCase(), tag.trim()])).values()];
    const normalizedTags: Array<Tag> = [];
    
    for(const tag of uniqueTags) {
      if(isEmpty(tag)) continue;
      
      normalizedTags.push(await tagsRepository.findOrCreate(tag));
    }
    
    return normalizedTags;
  }
  
  /** タグを一括追加し指定のサイトに紐付ける */
  public async attachNames(siteTagsRepository: SiteTagsRepository, tagsRepository: TagsRepository, siteId: number, tags: Array<string>): Promise<Array<Tag>> {
    const normalizedTags = await this.normalizeTags(tagsRepository, tags);
    await siteTagsRepository.attachTagIds(siteId, normalizedTags.map(tag => tag.id));
    return normalizedTags;
  }
  
  /** タグを一括追加し指定のサイトの紐付けを更新する */
  public async replaceNames(siteTagsRepository: SiteTagsRepository, tagsRepository: TagsRepository, siteId: number, tags: Array<string>): Promise<Array<Tag>> {
    const normalizedTags = await this.normalizeTags(tagsRepository, tags);
    await siteTagsRepository.replaceTagIds(siteId, normalizedTags.map(tag => tag.id));
    return normalizedTags;
  }
}
