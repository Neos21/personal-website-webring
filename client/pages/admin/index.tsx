import ky from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router';

import { isEmpty } from '../../../shared/helpers/is-empty';
import { TurnstileField } from '../../components/turnstile-field';
import { isAuthenticated, saveJwt } from '../../helpers/admin-auth';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

export default function Admin(): ReactElement {
  const navigate = useNavigate();
  
  const [password      , setPassword      ] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error       , setError       ] = useState<string>('');
  
  useEffect(() => {
    if(isAuthenticated()) navigate('/admin/dashboard', { replace: true });
  }, [navigate]);
  
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if(isSubmitting) return;
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const response = await ky.post('/api/admin/login', { json: { password, turnstile_token: turnstileToken } }).json<{ result: { token: string; } }>();
      saveJwt(response.result.token);
      navigate('/admin/dashboard');
    }
    catch(error) {
      setError(await extractApiErrorMessage(error, 'ログインに失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <main className="page-container">
      <h1>管理画面ログイン</h1>
      
      <form onSubmit={onSubmit}>
        <label className="form-label">
          管理パスワード
          <input type="password" value={password} onChange={event => setPassword(event.target.value)} />
        </label>
        
        <div className="form-label">Turnstile 認証</div>
        <TurnstileField onTokenChange={setTurnstileToken} />
        
        {!isEmpty(error) && <p className="text-error">{error}</p>}
        
        <button type="submit" disabled={isSubmitting}>ログイン</button>
      </form>
    </main>
  );
}
