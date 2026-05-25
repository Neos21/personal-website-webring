import { useEffect, useState, type ReactElement } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { adminApi } from '../../helpers/admin-api';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SiteIpAdmin } from '../../../shared/types/admin/admin-site-ip';

export default function AdminSiteIps(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // ページング
  const pageParam  = searchParams.get('page');
  const pageNumber = isEmpty(pageParam) ? 1 : Number(pageParam);
  const page       = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  // 一覧
  const [siteIps, setSiteIps] = useState<Array<SiteIpAdmin>>([]);
  const [hasNext, setHasNext] = useState<boolean>(false);
  
  // エラー表示系
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  useEffect(() => {
    setIsLoading(true);
    setError('');
    
    // URL に `page=1` がなければ再読込する
    const currentPageNumber = Number(pageParam);
    const needsPageFix = isEmpty(pageParam) || !Number.isInteger(currentPageNumber) || currentPageNumber <= 0;
    if(needsPageFix) {
      navigate('/admin/site-ips?page=1', { replace: true });
      return;
    }
    
    (async () => {
      try {
        const response = await adminApi.get(`/api/admin/site-ips?page=${page}`).json<{ result: { page: number; site_ips: Array<SiteIpAdmin>; has_next: boolean; }; }>();
        setSiteIps(response.result.site_ips);
        setHasNext(response.result.has_next);
      }
      catch(error) {
        setError(extractApiErrorMessage(error, 'サイト操作 IP アドレス履歴一覧の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [location.key, navigate, pageParam, page]);
  
  return (
    <main>
      <title>サイト操作 IP アドレス履歴管理 - 個人サイトウェブリング</title>
      <h1>サイト操作 IP アドレス履歴管理</h1>
      
      {!isEmpty(error) && (<div className="mb-8 p-4 font-bold text-red-600 bg-red-50">{error}</div>)}
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : siteIps.length === 0 ? (
        <>
          <div className="mb-8 text-slate-500 text-sm">サイト操作 IP アドレス履歴は登録されていません。</div>
          {(page > 1 || hasNext) && (
            <div className="mb-8 space-x-2 text-sm text-center">
              {page > 1            && (<Link to={{ pathname: '/admin/site-ips', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-slate-500"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/admin/site-ips', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
            </div>
          )}
        </>
      ) : (
        <>
          <table className="mb-8">
            <thead>
              <tr>
                <th>ID</th>
                <th>サイト ID</th>
                <th>操作</th>
                <th>種別</th>
                <th>IP アドレス</th>
                <th>操作日時</th>
              </tr>
            </thead>
            <tbody>
              {siteIps.map(siteIp => (
                <tr key={siteIp.id}>
                  <td className="text-right whitespace-nowrap">{siteIp.id}</td>
                  <td className="text-right whitespace-nowrap"><Link to={{ pathname: '/admin/site', search: `?id=${siteIp.site_id}` }}>{siteIp.site_id}</Link></td>
                  <td className="whitespace-nowrap">{siteIp.is_created === 1 ? '新規' : '編集'}</td>
                  <td className="whitespace-nowrap">{siteIp.is_self === 1 ? '自薦' : '他薦'}</td>
                  <td className="w-full">{siteIp.ip}</td>
                  <td className="whitespace-nowrap">{convertUtcToJst(siteIp.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {(page > 1 || hasNext) && (
            <div className="mb-8 space-x-2 text-sm text-center">
              {page > 1            && (<Link to={{ pathname: '/admin/site-ips', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-slate-500"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/admin/site-ips', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
            </div>
          )}
        </>
      )}
      
      <div className="text-right"><Link to="/admin/dashboard">ダッシュボード</Link> | <Link to="/">トップ</Link></div>
    </main>
  );
}
