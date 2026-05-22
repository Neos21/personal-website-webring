import { isHTTPError } from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { adminApi } from '../../helpers/admin-api';
import { removeJwt } from '../../helpers/admin-auth';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SiteAdmin } from '../../../shared/types/site';

export default function AdminSites(): ReactElement {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Array<SiteAdmin>>([]);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const loadSites = async (page: number): Promise<void> => {
    setError('');
    setIsLoading(true);
    
    try {
      const response = await adminApi.get(`/api/admin/sites?page=${page}`).json<{ result: { page: number; sites: Array<SiteAdmin>; has_next: boolean; } }>();
      setSites(response.result.sites);
      setHasNext(response.result.has_next);
    }
    catch(error) {
      if(isHTTPError(error) && error.response.status === 401) {
        removeJwt();
        navigate('/admin', { replace: true });
        return;
      }
      setError(extractApiErrorMessage(error, 'サイト一覧の取得に失敗しました'));
    }
    finally {
      setIsLoading(false);
    }
  };
  
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get('page');
  const pageNumber = pageParam == null ? 1 : Number(pageParam);
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  useEffect(() => {
    loadSites(page);
  }, [navigate, page]);
  
  const handleDelete = async (siteId: number): Promise<void> => {
    const confirmed = window.confirm('このサイトを削除してもよろしいですか？');
    if(!confirmed) return;
    
    setError('');
    setIsDeleting(true);
    
    try {
      await adminApi.delete(`/api/admin/sites/${siteId}`);
      await loadSites(page);
    }
    catch(error) {
      if(isHTTPError(error) && error.response.status === 401) {
        removeJwt();
        navigate('/admin', { replace: true });
        return;
      }
      setError(extractApiErrorMessage(error, 'サイトの削除に失敗しました'));
    }
    finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>サイト管理</h1>
      
      {isLoading ? (
        <p>読み込み中…</p>
      ) : error !== '' ? (
        <p className="text-error">{error}</p>
      ) : sites.length === 0 ? (
        <p>登録されているサイトはありません。</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>URL</th>
              <th>サイト名</th>
              <th>オーナー</th>
              <th>自己登録</th>
              <th>削除済み</th>
              <th>更新</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sites.map(site => (
              <tr key={site.id}>
                <td>{site.id}</td>
                <td><a href={site.url} target="_blank" rel="noreferrer noopener">{site.url}</a></td>
                <td>{site.site_name}</td>
                <td>{site.owner_name ?? '-'}</td>
                <td>{site.is_self === 1 ? 'はい' : 'いいえ'}</td>
                <td>{site.is_deleted === 1 ? 'はい' : 'いいえ'}</td>
                <td>{site.updated_at}</td>
                <td>
                  <button
                    type="button"
                    disabled={isDeleting || site.is_deleted === 1}
                    onClick={() => void handleDelete(site.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        {page > 1 && <Link to={{ pathname: '/admin/sites', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>}
        {hasNext && <Link to={{ pathname: '/admin/sites', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>}
      </div>
    </main>
  );
}
