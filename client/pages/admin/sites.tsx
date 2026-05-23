import { useEffect, useState, type ReactElement } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
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
    // URL に `page=1` がなければ再読込する
    const currentPageNumber = Number(pageParam);
    const needsPageFix = isEmpty(pageParam) || !Number.isInteger(currentPageNumber) || currentPageNumber <= 0;
    if(needsPageFix) {
      navigate('/admin/sites?page=1', { replace: true });
      return;
    }
    
    (async () => {
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
  }, [pageParam, page]);
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>登録サイト</h1>
      
      {isLoading ? (
        <p className="loading">読み込み中…</p>
      ) : !isEmpty(error) ? (
        <p className="text-error">{error}</p>
      ) : sites.length === 0 ? (
        <p>登録サイトはありません。</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>サイト名</th>
            </tr>
          </thead>
          <tbody>
            {sites.map(site => (
              <tr key={site.id} className={site.is_deleted === 1 ? 'row-deleted' : ''}>
                <td className="nowrap">{site.id}</td>
                <td><Link to={{ pathname: '/admin/site', search: `?id=${site.id}` }}>{site.site_name}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {(page > 1 || hasNext) && (
        <p className="text-center">
          {page > 1            && (<Link to={{ pathname: '/admin/sites', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
          {page > 1 && hasNext && (<span className="text-muted"> | </span>)}
          {hasNext             && (<Link to={{ pathname: '/admin/sites', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
        </p>
      )}
    </main>
  );
}
