import { isHTTPError } from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { adminApi } from '../../helpers/admin-api';
import { removeJwt } from '../../helpers/admin-auth';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { Tag } from '../../../shared/types/tag';

export default function AdminTags(): ReactElement {
  const navigate = useNavigate();
  
  const [tags, setTags] = useState<Array<Tag>>([]);
  const [hasNext, setHasNext] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get('page');
  const pageNumber = pageParam == null ? 1 : Number(pageParam);
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await adminApi.get(`/api/admin/tags?page=${page}`).json<{ result: { page: number; tags: Array<Tag>; has_next: boolean; } }>();
        setTags(response.result.tags);
        setHasNext(response.result.has_next);
      }
      catch(error) {
        if(isHTTPError(error) && error.response.status === 401) {
          removeJwt();
          navigate('/admin', { replace: true });
          return;
        }
        setError(await extractApiErrorMessage(error, 'タグ一覧の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [navigate, page]);
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>タグ管理</h1>
      
      {isLoading ? (
        <p>読み込み中…</p>
      ) : !isEmpty(error) ? (
        <p className="text-error">{error}</p>
      ) : tags.length === 0 ? (
        <p>タグが登録されていません。</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>タグ名</th>
            </tr>
          </thead>
          <tbody>
            {tags.map(tag => (
              <tr key={tag.id}>
                <td>{tag.id}</td>
                <td>{tag.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        {page > 1 && <Link to={{ pathname: '/admin/tags', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>}
        {hasNext && <Link to={{ pathname: '/admin/tags', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>}
      </div>
    </main>
  );
}
