import { Link } from 'react-router';

import { convertUtcToJst } from '../../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../../shared/helpers/is-empty';

import type { SitePublicWithTags } from '../../../../shared/types/site';
import type { ReactElement } from 'react';

type Props = {
  site: SitePublicWithTags;
};

export function SiteCard({ site }: Props): ReactElement {
  return (
    <article className="site-card" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>
        <a href={site.url} target="_blank">{site.site_name}</a>
      </h2>
      
      {!isEmpty(site.banner_url) && (
        <div className="site-banner" style={{ marginBottom: '1rem' }}>
          <a href={site.url} target="_blank">
            <img
              src={site.banner_url!}
              width={site.banner_width ?? undefined}
              height={site.banner_height ?? undefined}
              alt={site.site_name}
              title={site.site_name}
              style={{ maxWidth: '100%', height: 'auto', border: '1px solid #eee' }}
            />
          </a>
        </div>
      )}
      
      <p className="description pre-wrap">{site.description || '説明がありません'}</p>
      
      <ul className="site-meta" style={{ listStyle: 'none', padding: 0, color: '#666', fontSize: '0.9rem' }}>
        <li>管理人: {site.owner_name || '-'}</li>
        <li>登録日: {convertUtcToJst(site.created_at, true)}</li>
        <li>種別: {site.is_self === 1 ? '自薦' : '他薦'}</li>
      </ul>
      
      {site.tags && site.tags.length > 0 && (
        <div className="site-tags" style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
          {site.tags.map(tag => (
            <span key={tag.id} style={{ display: 'inline-block', background: '#e8f4f8', color: '#0277bd', padding: '0.25rem 0.5rem', borderRadius: '4px', marginRight: '0.5rem', fontSize: '0.85rem' }}>
              {tag.name}
            </span>
          ))}
        </div>
      )}
      
      <p className="text-right" style={{ margin: 0 }}>
        <Link to={{ pathname: '/site', search: `?id=${site.id}` }}>詳細・コメントを見る</Link>
      </p>
    </article>
  );
}
