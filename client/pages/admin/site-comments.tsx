import { useEffect, useState, type ReactElement } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { adminApi } from '../../helpers/admin-api';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SiteCommentAdmin } from '../../../shared/types/admin/admin-site-comment';

export default function AdminSiteComments(): ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // ページング
  const pageParam  = searchParams.get('page');
  const pageNumber = isEmpty(pageParam) ? 1 : Number(pageParam);
  const page       = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  // 一覧
  const [siteComments, setSiteComments] = useState<Array<SiteCommentAdmin>>([]);
  const [hasNext     , setHasNext     ] = useState<boolean>(false);
  
  // エラー表示系
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setSiteComments([]);
      setError('');
      
      // URL に `page=1` がなければ再読込する
      const currentPageNumber = Number(pageParam);
      const needsPageFix = isEmpty(pageParam) || !Number.isInteger(currentPageNumber) || currentPageNumber <= 0;
      if(needsPageFix) {
        navigate('/admin/site-comments?page=1', { replace: true });
        return;
      }
      
      try {
        const response = await adminApi.get(`/api/admin/site-comments?page=${page}`).json<{ result: { page: number; site_comments: Array<SiteCommentAdmin>; has_next: boolean; }; }>();
        setSiteComments(response.result.site_comments);
        setHasNext(response.result.has_next);
      }
      catch(error) {
        setError(extractApiErrorMessage(error, 'コメント一覧の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [navigate, pageParam, page]);
  
  return (
    <main>
      <title>サイト別コメント管理 - 個人サイトウェブリング</title>
      <h1>サイト別コメント管理</h1>
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : !isEmpty(error) ? (
        <div className="alert-danger mb-8 font-bold">{error}</div>
      ) : siteComments.length === 0 ? (
        <>
          <div className="text-muted mb-8 text-sm">コメントはありません。</div>
          {(page > 1 || hasNext) && (
            <div className="pager-links mb-8">
              {page > 1            && (<Link to={{ pathname: '/admin/site-comments', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-muted"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/admin/site-comments', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
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
                  <th>HN</th>
                  <th>本文</th>
                  <th>投稿日時</th>
                </tr>
              </thead>
              <tbody>
                {siteComments.map(siteComment => (
                  <tr key={siteComment.id}>
                    <td className="text-right whitespace-nowrap">
                      <div className="font-bold"><Link to={{ pathname: '/admin/site-comment', search: `?id=${siteComment.id}` }}>{siteComment.id}</Link></div>
                      <div><Link to={{ pathname: '/admin/site', search: `?id=${siteComment.site_id}` }}>{siteComment.site_id}</Link></div>
                    </td>
                    <td className="min-w-25 text-sm">{siteComment.user_name || '-'}</td>
                    <td className="min-w-40 w-full text-sm whitespace-pre-wrap">{siteComment.content}</td>
                    <td className="text-sm text-right whitespace-nowrap">{convertUtcToJst(siteComment.created_at).split(' ').map((part, index) => (<span key={index}>{part}{index === 0 && (<br />)}</span>))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {(page > 1 || hasNext) && (
            <div className="pager-links mb-8">
              {page > 1            && (<Link to={{ pathname: '/admin/site-comments', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-muted"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/admin/site-comments', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
            </div>
          )}
        </>
      )}
      
      <div className="text-right"><Link to="/admin/dashboard">ダッシュボード</Link> | <Link to="/">トップ</Link></div>
    </main>
  );
}
