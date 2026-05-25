import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { adminNewDenyDomainSchema, domainDisplayName, domainMaxLength } from '../../../shared/schemas/admin/admin-deny-domain-schema';
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
    
    const payload = {
      domain: domain
    };
    const parsed = adminNewDenyDomainSchema.safeParse(payload);
    if(!parsed.success) return setError(mergeIssues(parsed.error));
    
    try {
      await adminApi.post('/api/admin/deny-domains', { json: parsed.data }).json();
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
    <main>
      <title>禁止ドメイン管理 - 個人サイトウェブリング</title>
      <h1>禁止ドメイン管理</h1>
      
      <form className="mb-8 flex gap-x-3" onSubmit={onSubmit}>
        <input className="flex-1" type="text" placeholder={domainDisplayName} value={domain} maxLength={domainMaxLength} onChange={event => setDomain(event.target.value)} required />
        <button className="flex-none" type="submit">追加</button>
      </form>
      
      {!isEmpty(error) && (<div className="mb-8 p-4 font-bold text-red-600 bg-red-50">{error}</div>)}
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : domains.length === 0 ? (
        <div className="mb-8 text-slate-500 text-sm">禁止ドメインは登録されていません。</div>
      ) : (
        <table className="mb-8">
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
                <td className="text-right whitespace-nowrap">{domain.id}</td>
                <td className="w-full">{domain.domain}</td>
                <td className="text-sm whitespace-nowrap">{convertUtcToJst(domain.created_at)}</td>
                <td className="form-danger whitespace-nowrap"><button type="button" onClick={() => onDelete(domain.id)}>削除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <div className="text-right"><Link to="/admin/dashboard">ダッシュボード</Link> | <Link to="/">トップ</Link></div>
    </main>
  );
}
