import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';

import { AdminNavigation } from './components/admin-navigation';
import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { domainDisplayName, domainMaxLength } from '../../../shared/schemas/admin/admin-deny-domain-schema';
import { adminApi } from '../../helpers/admin-api';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { DenyDomainAdmin } from '../../../shared/types/admin/admin-deny-domain';

export default function AdminDenyDomains(): ReactElement {
  // 入力フォーム
  const [domain, setDomain] = useState<string>('');
  
  // エラー表示系
  const [error, setError] = useState<string>('');
  
  // 一覧
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [domains  , setDomains  ] = useState<Array<DenyDomainAdmin>>([]);
  
  useEffect(() => {
    fetchDenyDomains();
  }, []);
  
  const fetchDenyDomains = async (): Promise<void> => {
    setError('');
    setIsLoading(true);
    
    try {
      const response = await adminApi.get('/api/admin/deny-domains').json<{ result: Array<DenyDomainAdmin>; }>();
      setDomains(response.result);
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '禁止ドメイン一覧の取得に失敗しました'));
    }
    finally {
      setIsLoading(false);
    }
  };
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
    try {
      await adminApi.post('/api/admin/deny-domains', { json: { domain } }).json();
      setDomain('');
      await fetchDenyDomains();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '禁止ドメインの登録に失敗しました'));
    }
  };
  
  const onDelete = async (id: number): Promise<void> => {
    setError('');
    
    try {
      await adminApi.delete(`/api/admin/deny-domains/${id}`);
      await fetchDenyDomains();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '禁止ドメインの削除に失敗しました'));
    }
  };
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>禁止ドメイン</h1>
      
      <form onSubmit={onSubmit}>
        <label>
          <div className="form-label">{domainDisplayName}</div>
          <input type="text" placeholder={domainDisplayName} value={domain} maxLength={domainMaxLength} onChange={event => setDomain(event.target.value)} required />
        </label>
        <p><button type="submit">追加</button></p>
      </form>
      
      {!isEmpty(error) && (<p className="text-error">{error}</p>)}
      
      {isLoading ? (
        <p className="loading">読み込み中…</p>
      ) : domains.length === 0 ? (
        <p>禁止ドメインは登録されていません。</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>ドメイン</th>
              <th>登録日時</th>
              <th>削除</th>
            </tr>
          </thead>
          <tbody>
            {domains.map(domain => (
              <tr key={domain.id}>
                <td className="nowrap">{domain.id}</td>
                <td>{domain.domain}</td>
                <td className="nowrap">{convertUtcToJst(domain.created_at)}</td>
                <td className="form-delete"><button type="button" onClick={() => onDelete(domain.id)}>削除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
