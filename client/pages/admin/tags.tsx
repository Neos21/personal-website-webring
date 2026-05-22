import { isHTTPError } from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { adminApi } from '../../helpers/admin-api';
import { removeJwt } from '../../helpers/admin-auth';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { Tag } from '../../../shared/types/tag';

export default function AdminTags(): ReactElement {
  const navigate = useNavigate();
  
  const [tags, setTags] = useState<Array<Tag>>([]);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await adminApi.get('/api/admin/tags').json<{ result: Array<Tag> }>();
        setTags(response.result);
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
  }, [navigate]);
  
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
    </main>
  );
}
