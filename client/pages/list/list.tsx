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
    (async () => {
      // ページ遷移時の再読込のためココで初期化する
      setIsLoading(true);
      setSites([]);
      setError('');
      
      // URL に `page=1` がなければ再読込する
      const currentPageNumber = Number(pageParam);
      const needsPageFix = isEmpty(pageParam) || !Number.isInteger(currentPageNumber) || currentPageNumber <= 0;
      if(needsPageFix) {
        navigate('/list?page=1', { replace: true });
        return;
      }
      
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
  }, [navigate, pageParam, page]);
  
  return (
    <main>
      <title>登録サイト一覧 - 個人サイトウェブリング</title>
      <h1>登録サイト一覧</h1>
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : !isEmpty(error) ? (
        <div className="alert-danger mb-8 font-bold">{error}</div>
      ) : sites.length === 0 ? (
        <>
          <div className="text-muted mb-8 text-sm">まだ登録されているサイトはありません。</div>
          {(page > 1 || hasNext) && (
            <div className="pager-links mb-8">
              {page > 1            && (<Link to={{ pathname: '/list', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-muted"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/list', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
            </div>
          )}
        </>
      ) : (
        <>
          {sites.map(site => (
            <section key={site.id} className="site-card mb-8 pb-2">
              <h2 className="mb-4 font-bold text-lg"><a href={site.url} target="_blank">{site.site_name}</a></h2>
              
              {!isEmpty(site.banner_url) && (
                <div className="mb-4 overflow-hidden" style={{ width: `${site.banner_width!}px`, height: `${site.banner_height!}px` }}>
                  <a href={site.url} target="_blank"><img src={site.banner_url!} width={site.banner_width!} height={site.banner_height!} alt={site.site_name} title={site.site_name} /></a>
                </div>
              )}
              
              <div className="mb-4 text-sm whitespace-pre-wrap">{site.description || '説明はありません'}</div>
              
              <ul className="text-muted mb-4 text-xs">
                <li>
                  ID : [{site.id}]
                  {site.is_self === 1 ? (<span className="label-success ml-2">自薦</span>) : (<span className="label-info ml-2">他薦</span>)}
                </li>
                <li>管理人 : {site.owner_name || '-'}</li>
                <li>更新日 : {convertUtcToJst(site.updated_at, true)}</li>
              </ul>
              
              <div>
                {site.tags.map(tag => (
                  <span className="tag" key={tag.id}>{tag.name}</span>
                ))}
              </div>
              
              <div className="text-sm text-right"><Link to={{ pathname: '/site', search: `?id=${site.id}&page=1` }}>詳細・コメントを見る</Link></div>
            </section>
          ))}
          
          {(page > 1 || hasNext) && (
            <div className="pager-links mb-8">
              {page > 1            && (<Link to={{ pathname: '/list', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-muted"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/list', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
            </div>
          )}
        </>
      )}
      
      <div className="text-right"><Link to="/">トップへ戻る</Link></div>
    </main>
  );
}
