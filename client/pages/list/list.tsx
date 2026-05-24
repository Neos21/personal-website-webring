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
    <main>
      <title>登録サイト一覧 - 個人サイトウェブリング</title>
      <h1>登録サイト一覧</h1>
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : !isEmpty(error) ? (
        <div className="mb-8 p-4 font-bold text-red-600 bg-red-50">{error}</div>
      ) : sites.length === 0 ? (
        <>
          <div className="mb-8 text-slate-500 text-sm">まだ登録されているサイトはありません。</div>
          {(page > 1 || hasNext) && (
            <div className="mb-8 space-x-2 text-sm text-center">
              {page > 1            && (<Link to={{ pathname: '/list', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-slate-500"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/list', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
            </div>
          )}
        </>
      ) : (
        <>
          {sites.map(site => (
            <section key={site.id} className="mb-8 border border-slate-500 p-3 pb-2 bg-white">
              <h2 className="mb-4 font-bold text-lg"><a href={site.url} target="_blank">{site.site_name}</a></h2>
              
              {!isEmpty(site.banner_url) && (
                <div className="mb-4 overflow-hidden" style={{ width: `${site.banner_width!}px`, height: `${site.banner_height!}px` }}>
                  <a href={site.url} target="_blank"><img src={site.banner_url!} width={site.banner_width!} height={site.banner_height!} alt={site.site_name} title={site.site_name} /></a>
                </div>
              )}
              
              <div className="mb-4 text-sm whitespace-pre-wrap">{site.description || '説明はありません'}</div>
              
              <ul className="mb-4 text-slate-500 text-xs">
                <li>
                  ID : [{site.id}]
                  {site.is_self === 1 ? (<span className="ml-2 p-1 font-bold text-emerald-600 bg-emerald-50">自薦</span>) : (<span className="ml-2 p-1 font-bold text-indigo-600 bg-indigo-50">他薦</span>)}
                </li>
                <li>管理人 : {site.owner_name || '-'}</li>
                <li>更新日 : {convertUtcToJst(site.updated_at, true)}</li>
              </ul>
              
              <div>
                {site.tags.map(tag => (
                  <span className="inline-block mr-2 mb-2 p-1 text-sky-600 text-sm bg-sky-50" key={tag.id}>{tag.name}</span>
                ))}
              </div>
              
              <div className="text-sm text-right"><Link to={{ pathname: '/site', search: `?id=${site.id}&page=1` }}>詳細・コメントを見る</Link></div>
            </section>
          ))}
          
          {(page > 1 || hasNext) && (
            <div className="mb-8 space-x-2 text-sm text-center">
              {page > 1            && (<Link to={{ pathname: '/list', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-slate-500"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/list', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
            </div>
          )}
        </>
      )}
      
      <div className="text-right"><Link to="/">トップへ戻る</Link></div>
    </main>
  );
}
