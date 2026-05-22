import { isHTTPError } from 'ky';
import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { adminApi } from '../../helpers/admin-api';
import { removeJwt } from '../../helpers/admin-auth';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { DenyDomain } from '../../../shared/types/deny-domain';

export default function AdminDenyDomains(): ReactElement {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Array<DenyDomain>>([]);
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchDomains = async (): Promise<void> => {
    setError('');
    setIsLoading(true);
    try {
      const response = await adminApi.get('/api/admin/deny-domains').json<{ result: Array<DenyDomain> }>();
      setDomains(response.result);
    }
    catch(error) {
      if(isHTTPError(error) && error.response.status === 401) {
        removeJwt();
        navigate('/admin', { replace: true });
        return;
      }
      setError(await extractApiErrorMessage(error, '禁止ドメイン一覧の取得に失敗しました'));
    }
    finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    void fetchDomains();
  }, []);
  
  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
    try {
      await adminApi.post('/api/admin/deny-domains', { json: { domain } }).json();
      setDomain('');
      await fetchDomains();
    }
    catch(error) {
      setError(await extractApiErrorMessage(error, '禁止ドメインの登録に失敗しました'));
    }
  };
  
  const handleDelete = async (id: number): Promise<void> => {
    setError('');
    try {
      await adminApi.delete(`/api/admin/deny-domains/${id}`);
      await fetchDomains();
    }
    catch(error) {
      setError(await extractApiErrorMessage(error, '禁止ドメインの削除に失敗しました'));
    }
  };
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>禁止ドメイン管理</h1>
      
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          ドメイン
          <input
            type="text"
            value={domain}
            onChange={event => setDomain(event.target.value)}
            placeholder="example.com"
          />
        </label>
        <button type="submit">追加</button>
      </form>
      
      {error !== '' && <p className="text-error">{error}</p>}
      
      {isLoading ? (
        <p>読み込み中…</p>
      ) : domains.length === 0 ? (
        <p>禁止ドメインが登録されていません。</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>ドメイン</th>
              <th>登録日時</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {domains.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.domain}</td>
                <td>{item.created_at}</td>
                <td>
                  <button type="button" onClick={() => void handleDelete(item.id)}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
