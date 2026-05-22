import type { Tag } from './tag';

export type SiteAdmin = {
  id: number;
  is_self: number;
  url: string;
  site_name: string;
  owner_name: string | null;
  description: string | null;
  banner_url: string | null;
  banner_width: number | null;
  banner_height: number | null;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: number;
};

/** サイト削除フォームなど・タグは別テーブル管理で取得にも手間取るため */
export type SitePublic = Omit<SiteAdmin, 'password_hash' | 'is_deleted'>;

export type SitePublicWithTags = SitePublic & { tags: Array<Tag>; };

/** 編集・削除時のパスワード認証で使用する */
export type SiteForAuth = Pick<SiteAdmin, 'id' | 'is_self' | 'password_hash' | 'is_deleted'>;

/** ウェブリング機能・類似 URL チェック時に使用する */
export type SiteUrl = Pick<SiteAdmin, 'id' | 'url'>;

export type NewSite = Pick<SiteAdmin, 'is_self' | 'url' | 'site_name' | 'owner_name' | 'description' | 'banner_url' | 'banner_width' | 'banner_height' | 'password_hash'>;

export type UpdateSite = Pick<SiteAdmin, 'id' | 'url' | 'site_name' | 'owner_name' | 'description' | 'banner_url' | 'banner_width' | 'banner_height' | 'password_hash'>;
