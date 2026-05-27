import ky from 'ky';
import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { adminLoginSchema, adminPasswordDisplayName } from '../../../shared/schemas/admin/admin-login-schema';
import { TurnstileField } from '../../components/turnstile-field';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';
import { useAdminStore } from '../../stores/admin-store';

export default function Admin(): ReactElement {
  const navigate = useNavigate();
  
  // 入力フォーム
  const [password      , setPassword      ] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  
  // エラー表示系
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error       , setError       ] = useState<string>('');
  
  useEffect(() => {
    if(!isEmpty(useAdminStore.getState().token)) navigate('/admin/dashboard');
  }, [navigate]);
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
    const payload = {
      password       : password,
      turnstile_token: turnstileToken
    };
    const parsed = adminLoginSchema.safeParse(payload);
    if(!parsed.success) return setError(mergeIssues(parsed.error));
    
    setIsSubmitting(true);
    try {
      const response = await ky.post('/api/admin/login', { json: parsed.data }).json<{ result: { token: string; }; }>();
      useAdminStore.getState().setToken(response.result.token);
      navigate('/admin/dashboard');
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'ログインに失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <main>
      <title>リングマスター管理ログイン - 個人サイトウェブリング</title>
      <h1>リングマスター管理ログイン</h1>
      
      <form className="mb-8 space-y-4" onSubmit={onSubmit}>
        <div><input type="password" placeholder={adminPasswordDisplayName} value={password} onChange={event => setPassword(event.target.value)} required /></div>
        
        <TurnstileField onTokenChange={setTurnstileToken} />
        
        {!isEmpty(error) && (<div className="alert-danger font-bold">{error}</div>)}
        
        <div><button type="submit" disabled={isSubmitting}>ログイン</button></div>
      </form>
      
      <div className="text-right"><Link to="/">トップへ戻る</Link></div>
    </main>
  );
}
