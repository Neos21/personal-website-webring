import { isHTTPError } from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { adminApi } from '../../helpers/admin-api';
import { removeJwt } from '../../helpers/admin-auth';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SiteAdmin } from '../../../shared/types/site';

export default function AdminSites(): ReactElement {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Array<SiteAdmin>>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const loadSites = async (): Promise<void> => {
    setError('');
    setIsLoading(true);
    
    try {
      const response = await adminApi.get('/api/admin/sites').json<{ result: Array<SiteAdmin> }>();
      setSites(response.result);
    }
    catch(error) {
      if(isHTTPError(error) && error.response.status === 401) {
        removeJwt();
        navigate('/admin', { replace: true });
        return;
      }
      setError(await extractApiErrorMessage(error, 'サイト一覧の取得に失敗しました'));
    }
    finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadSites();
  }, [navigate]);
  
  const handleDelete = async (siteId: number): Promise<void> => {
    const confirmed = window.confirm('このサイトを削除してもよろしいですか？');
    if(!confirmed) return;
    
    setError('');
    setIsDeleting(true);
    
    try {
      await adminApi.delete(`/api/admin/sites/${siteId}`);
      await loadSites();
    }
    catch(error) {
      if(isHTTPError(error) && error.response.status === 401) {
        removeJwt();
        navigate('/admin', { replace: true });
        return;
      }
      setError(await extractApiErrorMessage(error, 'サイトの削除に失敗しました'));
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
    </main>
  );
}
