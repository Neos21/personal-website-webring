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
  
  // 入力フォーム
  const [password      , setPassword      ] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  
  // エラー表示系
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [clientError , setClientError ] = useState<string>('');
  const [serverError , setServerError ] = useState<string>('');
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setClientError('');
    setServerError('');
    
    if(!window.confirm('本当にこのサイトを削除しますか？\nこの操作は取り消せません。')) return;
    
    const payload = {
      password       : password,
      turnstile_token: turnstileToken
    };
    const parsed = deleteSiteSchema.safeParse(payload);
    if(!parsed.success) return setClientError(mergeIssues(parsed.error));
    
    setIsSubmitting(true);
    try {
      await ky.delete(`/api/sites/${site.id}`, { json: parsed.data }).text();  // 204 No Content が返るため `.json()` でコールするとエラーになる
      navigate('/list');
    }
    catch(error) {
      setServerError(extractApiErrorMessage(error, '削除に失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={onSubmit} className="form-delete">
      <fieldset>
        <legend>サイトの削除</legend>
        <div className="text-muted">サイトを削除します。実行するには管理パスワードを入力してください。</div>
        
        <label>
          <div className="form-label">{passwordDisplayName} <span className="form-label-memo">(必須・{passwordMaxLength}文字以内)</span></div>
          <input type="password" placeholder={passwordDisplayName} value={password} maxLength={passwordMaxLength} onChange={event => setPassword(event.target.value)} required />
        </label>
        
        <TurnstileField onTokenChange={setTurnstileToken} />
        
        {!isEmpty(clientError) && <p className="text-error">{clientError}</p>}
        {!isEmpty(serverError) && <p className="text-error">{serverError}</p>}
        
        <p className="text-right"><button type="submit" disabled={isSubmitting}>{isSubmitting ? '処理中…' : '削除する'}</button></p>
      </fieldset>
    </form>
  );
}
