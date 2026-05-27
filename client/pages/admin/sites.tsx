import { useEffect, useState, type ReactElement } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { adminApi } from '../../helpers/admin-api';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SiteAdmin } from '../../../shared/types/admin/admin-site';

export default function AdminSites(): ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // ページング
  const pageParam  = searchParams.get('page');
  const pageNumber = isEmpty(pageParam) ? 1 : Number(pageParam);
  const page       = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  // 一覧
  const [sites  , setSites  ] = useState<Array<SiteAdmin>>([]);
  const [hasNext, setHasNext] = useState<boolean>(false);
  
  // エラー表示系
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setSites([]);
      setError('');
      
      // URL に `page=1` がなければ再読込する
      const currentPageNumber = Number(pageParam);
      const needsPageFix = isEmpty(pageParam) || !Number.isInteger(currentPageNumber) || currentPageNumber <= 0;
      if(needsPageFix) {
        navigate('/admin/sites?page=1', { replace: true });
        return;
      }
      
      try {
        const response = await adminApi.get(`/api/admin/sites?page=${page}`).json<{ result: { page: number; sites: Array<SiteAdmin>; has_next: boolean; }; }>();
        setSites(response.result.sites);
        setHasNext(response.result.has_next);
      }
      catch(error) {
        setError(extractApiErrorMessage(error, '登録サイト一覧の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [navigate, pageParam, page]);
  
  return (
    <main>
      <title>サイト管理 - 個人サイトウェブリング</title>
      <h1>サイト管理</h1>
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : !isEmpty(error) ? (
        <div className="mb-8 p-4 font-bold text-red-600 bg-red-50">{error}</div>
      ) : sites.length === 0 ? (
        <>
          <div className="mb-8 text-slate-500 text-sm">登録サイトはありません。</div>
          {(page > 1 || hasNext) && (
            <div className="mb-8 space-x-2 text-sm text-center">
              {page > 1            && (<Link to={{ pathname: '/admin/sites', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-slate-500"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/admin/sites', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-8 overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>サイト名</th>
                  <th>更新日時</th>
                </tr>
              </thead>
              <tbody>
                {sites.map(site => (
                  <tr key={site.id} className={site.is_deleted === 1 ? '[&>td]:bg-red-50' : ''}>  {/* eslint-disable-line neos-eslint-plugin/comment-colon-spacing */}
                    <td className="text-right whitespace-nowrap">{site.id}</td>
                    <td className="w-full"><Link to={{ pathname: '/admin/site', search: `?id=${site.id}` }}>{site.site_name}</Link></td>
                    <td className="text-sm text-right whitespace-nowrap">{convertUtcToJst(site.updated_at).split(' ').map((part, index) => (<span key={index}>{part}{index === 0 && (<br />)}</span>))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {(page > 1 || hasNext) && (
            <div className="mb-8 space-x-2 text-sm text-center">
              {page > 1            && (<Link to={{ pathname: '/admin/sites', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-slate-500"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/admin/sites', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
            </div>
          )}
        </>
      )}
      
      <div className="text-right"><Link to="/admin/dashboard">ダッシュボード</Link> | <Link to="/">トップ</Link></div>
    </main>
  );
}
