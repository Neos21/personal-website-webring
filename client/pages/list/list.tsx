import ky from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SitePublicWithTags } from '../../../shared/types/site';

export default function List(): ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // ページング
  const pageParam  = searchParams.get('page');
  const pageNumber = isEmpty(pageParam) ? 1 : Number(pageParam);
  const page       = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  // サイト一覧
  const [sites  , setSites  ] = useState<Array<SitePublicWithTags>>([]);
  const [hasNext, setHasNext] = useState<boolean>(false);
  
  // エラー表示系
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  useEffect(() => {
    // URL に `page=1` がなければ再読込する
    const currentPageNumber = Number(pageParam);
    const needsPageFix = isEmpty(pageParam) || !Number.isInteger(currentPageNumber) || currentPageNumber <= 0;
    if(needsPageFix) {
      navigate('/list?&page=1', { replace: true });
      return;
    }
    
    (async () => {
      try {
        const response = await ky.get(`/api/sites?page=${page}`).json<{ result: { page: number; sites: Array<SitePublicWithTags>; has_next: boolean; }; }>();
        setSites(response.result.sites);
        setHasNext(response.result.has_next);
      }
      catch(error) {
        setError(extractApiErrorMessage(error, '一覧の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [pageParam, page]);
  
  return (
    <main className="page-container">
      <h1>登録済サイト一覧</h1>
      
      {isLoading ? (
        <p className="loading">読み込み中…</p>
      ) : !isEmpty(error) ? (
        <p className="text-error">{error}</p>
      ) : sites.length === 0 ? (
        <>
          <p>登録されているサイトはありません。</p>
          {(page > 1 || hasNext) && (
            <p className="text-center">
              {page > 1 && (
                <Link to={{ pathname: '/list', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>
              )}
              {page > 1 && hasNext && (
                <span className="text-muted"> | </span>
              )}
              {hasNext && (
                <Link to={{ pathname: '/list', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>
              )}
            </p>
          )}
        </>
      ) : (
        <>
          {sites.map(site => (
            <article key={site.id} className="site-card">
              <h2><a href={site.url} target="_blank">{site.site_name}</a></h2>
              
              {!isEmpty(site.banner_url) && (
                <p>
                  <a href={site.url} target="_blank">
                    <img
                      src={site.banner_url!}
                      width={site.banner_width ?? undefined}
                      height={site.banner_height ?? undefined}
                      alt={site.site_name}
                      title={site.site_name}
                    />
                  </a>
                </p>
              )}
              
              <p className="pre-wrap">{site.description || '説明はありません'}</p>
              
              <ul>
                <li>管理人 : {site.owner_name || '-'}</li>
                <li>登録日 : {convertUtcToJst(site.created_at, true)}</li>
                <li>更新日 : {convertUtcToJst(site.updated_at, true)}</li>
                <li>{site.is_self === 1 ? '自薦' : '他薦'}</li>
              </ul>
              
              <div className="tags">
                {site.tags.map(tag => (
                  <span key={tag.id} className="tag">{tag.name}</span>
                ))}
              </div>
              
              <p className="text-right"><Link to={{ pathname: '/site', search: `?id=${site.id}` }}>詳細・コメントを見る</Link></p>
            </article>
          ))}
          
          {(page > 1 || hasNext) && (
            <p className="text-center">
              {page > 1 && (
                <Link to={{ pathname: '/list', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>
              )}
              {page > 1 && hasNext && (
                <span className="text-muted"> | </span>
              )}
              {hasNext && (
                <Link to={{ pathname: '/list', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>
              )}
            </p>
          )}
        </>
      )}
      
      <p className="text-right"><Link to="/">トップへ戻る</Link></p>
    </main>
  );
}
