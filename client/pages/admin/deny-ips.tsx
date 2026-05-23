import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';

import { AdminNavigation } from './components/admin-navigation';
import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { ipDisplayName } from '../../../shared/schemas/admin/admin-deny-ip-schema';
import { adminApi } from '../../helpers/admin-api';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { DenyIpAdmin } from '../../../shared/types/admin/admin-deny-ip';

export default function AdminDenyIps(): ReactElement {
  // 入力フォーム
  const [ip, setIp] = useState<string>('');
  
  // エラー表示系
  const [error, setError] = useState<string>('');
  
  // 一覧
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [denyIps  , setDenyIps  ] = useState<Array<DenyIpAdmin>>([]);
  
  useEffect(() => {
    fetchDenyIps();
  }, []);
  
  const fetchDenyIps = async (): Promise<void> => {
    setError('');
    setIsLoading(true);
    
    try {
      const response = await adminApi.get('/api/admin/deny-ips').json<{ result: Array<DenyIpAdmin>; }>();
      setDenyIps(response.result);
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'IP アドレス一覧の取得に失敗しました'));
    }
    finally {
      setIsLoading(false);
    }
  };
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
    try {
      await adminApi.post('/api/admin/deny-ips', { json: { ip } }).json();
      setIp('');
      await fetchDenyIps();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'IP アドレスの登録に失敗しました'));
    }
  };
  
  const onDelete = async (id: number): Promise<void> => {
    setError('');
    
    try {
      await adminApi.delete(`/api/admin/deny-ips/${id}`);
      await fetchDenyIps();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'IP アドレスの削除に失敗しました'));
    }
  };
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>IP アドレス管理</h1>
      
      <form onSubmit={onSubmit}>
        <label>
          <div className="form-label">{ipDisplayName}</div>
          <input type="text" placeholder={ipDisplayName} value={ip} onChange={event => setIp(event.target.value)} required />
        </label>
        <p><button type="submit">追加</button></p>
      </form>
      
      {!isEmpty(error) && (<p className="text-error">{error}</p>)}
      
      {isLoading ? (
        <p className="loading">読み込み中…</p>
      ) : denyIps.length === 0 ? (
        <p>IP アドレスは登録されていません。</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>IP アドレス</th>
              <th>登録日時</th>
              <th>削除</th>
            </tr>
          </thead>
          <tbody>
            {denyIps.map(denyIp => (
              <tr key={denyIp.id}>
                <td>{denyIp.id}</td>
                <td>{denyIp.ip}</td>
                <td>{convertUtcToJst(denyIp.created_at)}</td>
                <td className="form-delete"><button type="button" onClick={() => onDelete(denyIp.id)}>削除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
