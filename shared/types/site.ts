import type { SiteAdmin } from './admin/site';
import type { Tag } from './tag';

/** サイト削除フォームなど・タグは別テーブル管理で取得にも手間取るため */
export type SitePublic = Omit<SiteAdmin, 'password_hash' | 'is_deleted'>;

export type SitePublicWithTags = SitePublic & { tags: Array<Tag>; };

/** 編集・削除時のパスワード認証で使用する */
export type SiteForAuth = Pick<SiteAdmin, 'id' | 'is_self' | 'password_hash' | 'is_deleted'>;

/** ウェブリング機能・類似 URL チェック時に使用する */
export type SiteUrl = Pick<SiteAdmin, 'id' | 'url'>;

/** 重複・類似 URL 情報の表示・サポート掲示板のサイト情報表示に使用する */
export type SiteNameUrl = Pick<SiteAdmin, 'id' | 'site_name' | 'url'>;

export type NewSite = Pick<SiteAdmin, 'is_self' | 'url' | 'site_name' | 'owner_name' | 'description' | 'banner_url' | 'banner_width' | 'banner_height' | 'password_hash'>;

export type UpdateSite = Pick<SiteAdmin, 'id' | 'url' | 'site_name' | 'owner_name' | 'description' | 'banner_url' | 'banner_width' | 'banner_height' | 'password_hash'>;
