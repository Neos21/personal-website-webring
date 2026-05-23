import ky from 'ky';
import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router';

import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { adminLoginSchema, adminPasswordDisplayName } from '../../../shared/schemas/admin/admin-login-schema';
import { TurnstileField } from '../../components/turnstile-field';
import { isAuthenticated, saveJwt } from '../../helpers/admin-auth';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

export default function Admin(): ReactElement {
  const navigate = useNavigate();
  
  // 入力フォーム
  const [password      , setPassword      ] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  
  // エラー表示系
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error       , setError       ] = useState<string>('');
  
  useEffect(() => {
    if(isAuthenticated()) navigate('/admin/dashboard');
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
      saveJwt(response.result.token);
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
    <main className="page-container">
      <h1>リングマスター管理画面</h1>
      
      <form onSubmit={onSubmit}>
        <label>
          <div className="form-label">{adminPasswordDisplayName}</div>
          <input type="password" placeholder={adminPasswordDisplayName} value={password} onChange={event => setPassword(event.target.value)} required />
        </label>
        
        <TurnstileField onTokenChange={setTurnstileToken} />
        
        {!isEmpty(error) && (<p className="text-error">{error}</p>)}
        
        <p><button type="submit" disabled={isSubmitting}>ログイン</button></p>
      </form>
    </main>
  );
}
