import ky from 'ky';
import { useState, type ReactElement, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router';

import { isEmpty } from '../../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { deleteSiteSchema, passwordDisplayName, passwordMaxLength } from '../../../../shared/schemas/site-schema';
import { TurnstileField } from '../../../components/turnstile-field';
import { extractApiErrorMessage } from '../../../helpers/extract-api-error-message';

import type { SitePublic } from '../../../../shared/types/site';

type Props = {
  site: SitePublic;
};

export function DeleteSiteForm({ site }: Props): ReactElement {
  const navigate = useNavigate();
  
  const [password      , setPassword      ] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [isSubmitting  , setIsSubmitting  ] = useState<boolean>(false);
  const [clientError   , setClientError   ] = useState<string>('');
  const [serverError   , setServerError   ] = useState<string>('');
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setClientError('');
    setServerError('');
    
    if(!window.confirm('本当にこのサイトを削除しますか？\nこの操作は取り消せません。')) return;
    
    const payload = { password, turnstile_token: turnstileToken };
    const parsed = deleteSiteSchema.safeParse(payload);
    if(!parsed.success) return setClientError(mergeIssues(parsed.error));
    
    setIsSubmitting(true);
    try {
      await ky.delete(`/api/sites/${site.id}`, { json: parsed.data }).json();
      alert('サイトを削除しました。');
      navigate('/list');
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '削除に失敗しました');
      setServerError(errorMessage);
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={onSubmit} style={{ marginTop: '3rem', padding: '1rem', border: '1px solid #ffcccc', borderRadius: '8px', background: '#fffafa' }}>
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ color: '#cc0000', fontWeight: 'bold' }}>サイトの削除</legend>
        <p className="form-label-memo">サイトを削除します。実行するには管理パスワードを入力してください。</p>
        
        <label>
          <div className="form-label">{passwordDisplayName} <span className="form-label-memo">(必須・{passwordMaxLength}文字以内)</span></div>
          <input type="password" placeholder={passwordDisplayName} value={password} maxLength={passwordMaxLength} onChange={event => setPassword(event.target.value)} required />
        </label>
        
        <div style={{ marginTop: '1rem' }}>
          <TurnstileField onTokenChange={setTurnstileToken} />
        </div>
        
        {!isEmpty(clientError) && <p className="text-error">{clientError}</p>}
        {!isEmpty(serverError) && <p className="text-error">{serverError}</p>}
        
        <p><button type="submit" disabled={isSubmitting} style={{ background: '#cc0000', color: '#fff', border: 'none' }}>{isSubmitting ? '処理中…' : '削除する'}</button></p>
      </fieldset>
    </form>
  );
}
