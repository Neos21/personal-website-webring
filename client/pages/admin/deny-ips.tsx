import { useCallback, useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { adminNewDenyIpSchema, ipDisplayName } from '../../../shared/schemas/admin/admin-deny-ip-schema';
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
  
  const fetchDenyIps = useCallback(async (): Promise<void> => {
    setError('');
    setIsLoading(true);
    
    try {
      const response = await adminApi.get('/api/admin/deny-ips').json<{ result: Array<DenyIpAdmin>; }>();
      setDenyIps(response.result);
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '禁止 IP アドレス一覧の取得に失敗しました'));
    }
    finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    (async () => {
      await fetchDenyIps();
    })();
  }, [fetchDenyIps]);
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
    const payload = {
      ip: ip
    };
    const parsed = adminNewDenyIpSchema.safeParse(payload);
    if(!parsed.success) return setError(mergeIssues(parsed.error));
    
    try {
      await adminApi.post('/api/admin/deny-ips', { json: parsed.data }).json();
      setIp('');
      await fetchDenyIps();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '禁止 IP アドレスの登録に失敗しました'));
    }
  };
  
  const onDelete = async (id: number): Promise<void> => {
    setError('');
    
    try {
      await adminApi.delete(`/api/admin/deny-ips/${id}`);
      await fetchDenyIps();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '禁止 IP アドレスの削除に失敗しました'));
    }
  };
  
  return (
    <main>
      <title>禁止 IP アドレス管理 - 個人サイトウェブリング</title>
      <h1>禁止 IP アドレス管理</h1>
      
      <form className="mb-8 flex gap-x-3" onSubmit={onSubmit}>
        <input className="flex-1" type="text" placeholder={ipDisplayName} value={ip} onChange={event => setIp(event.target.value)} required />
        <button className="flex-none" type="submit">追加</button>
      </form>
      
      {!isEmpty(error) && (<div className="mb-8 p-4 font-bold text-red-600 bg-red-50">{error}</div>)}
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : denyIps.length === 0 ? (
        <div className="mb-8 text-slate-500 text-sm">禁止 IP アドレスは登録されていません。</div>
      ) : (
        <table className="mb-8">
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
                <td className="text-right whitespace-nowrap">{denyIp.id}</td>
                <td className="w-full">{denyIp.ip}</td>
                <td className="text-sm text-right whitespace-nowrap">{convertUtcToJst(denyIp.created_at).split(' ').map((part, index) => (<span key={index}>{part}{index === 0 && (<br />)}</span>))}</td>
                <td className="form-danger whitespace-nowrap"><button type="button" onClick={() => onDelete(denyIp.id)}>削除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <div className="text-right"><Link to="/admin/dashboard">ダッシュボード</Link> | <Link to="/">トップ</Link></div>
    </main>
  );
}
