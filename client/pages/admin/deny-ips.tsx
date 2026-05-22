import { isHTTPError } from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { adminApi } from '../../helpers/admin-api';
import { removeJwt } from '../../helpers/admin-auth';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { DenyIp } from '../../../shared/types/deny-ip';

export default function AdminDenyIps(): ReactElement {
  const navigate = useNavigate();
  const [denyIps, setDenyIps] = useState<Array<DenyIp>>([]);
  const [ip, setIp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const loadDenyIps = async (): Promise<void> => {
    setError('');
    setIsLoading(true);
    
    try {
      const response = await adminApi.get('/api/admin/deny-ips').json<{ result: Array<DenyIp> }>();
      setDenyIps(response.result);
    }
    catch(error) {
      if(isHTTPError(error) && error.response.status === 401) {
        removeJwt();
        navigate('/admin', { replace: true });
        return;
      }
      setError(await extractApiErrorMessage(error, 'IP 制限の取得に失敗しました'));
    }
    finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadDenyIps();
  }, [navigate]);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if(isSubmitting) return;
    
    const trimmedIp = ip.trim();
    if(trimmedIp === '') {
      setError('IP アドレスを入力してください');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      await adminApi.post('/api/admin/deny-ips', { json: { ip: trimmedIp } }).json<{ result: { id: number } }>();
      setIp('');
      await loadDenyIps();
    }
    catch(error) {
      if(isHTTPError(error) && error.response.status === 401) {
        removeJwt();
        navigate('/admin', { replace: true });
        return;
      }
      setError(await extractApiErrorMessage(error, 'IP 制限の登録に失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (id: number): Promise<void> => {
    const confirmed = window.confirm('この IP 制限を削除してもよろしいですか？');
    if(!confirmed) return;
    
    setError('');
    
    try {
      await adminApi.delete(`/api/admin/deny-ips/${id}`);
      await loadDenyIps();
    }
    catch(error) {
      if(isHTTPError(error) && error.response.status === 401) {
        removeJwt();
        navigate('/admin', { replace: true });
        return;
      }
      setError(await extractApiErrorMessage(error, 'IP 制限の削除に失敗しました'));
    }
  };
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>IP 制限管理</h1>
      
      <form onSubmit={handleSubmit}>
        <label className="form-label">
          IP アドレス
          <input
            type="text"
            value={ip}
            onChange={event => setIp(event.target.value)}
            placeholder="例 : 203.0.113.1"
          />
        </label>
        
        <button type="submit" disabled={isSubmitting}>追加</button>
      </form>
      
      {error !== '' && <p className="text-error">{error}</p>}
      
      {isLoading ? (
        <p>読み込み中…</p>
      ) : denyIps.length === 0 ? (
        <p>IP 制限は登録されていません。</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>IP</th>
              <th>登録日時</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {denyIps.map(denyIp => (
              <tr key={denyIp.id}>
                <td>{denyIp.id}</td>
                <td>{denyIp.ip}</td>
                <td>{denyIp.created_at}</td>
                <td>
                  <button type="button" onClick={() => void handleDelete(denyIp.id)}>
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
