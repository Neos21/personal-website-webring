import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { adminUpdateSiteCommentSchema } from '../../../shared/schemas/admin/admin-site-comment-schema';
import { commentDisplayName, commentMaxLength, userNameDisplayName, userNameMaxLength } from '../../../shared/schemas/site-comment-schema';
import { adminApi } from '../../helpers/admin-api';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SiteCommentAdmin } from '../../../shared/types/admin/admin-site-comment';

export default function AdminSiteComment(): ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // コメント ID パラメータ (必須)
  const idParam = searchParams.get('id');
  const id      = isEmpty(idParam) ? null : Number(idParam);
  
  // コメント詳細 (表示専用)
  const [siteComment, setSiteComment] = useState<SiteCommentAdmin | null>(null);
  
  // 入力フォーム
  const [userName, setUserName] = useState<string>('');
  const [content , setContent ] = useState<string>('');
  
  // エラー表示系
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const [error    , setError    ] = useState<string>('');
  
  useEffect(() => {
    if(id == null) {
      setLoadError('コメント ID が指定されていません');
      setIsLoading(false);
      return;
    }
    if(!Number.isInteger(id) || id <= 0) {
      setLoadError('コメント ID が不正です');
      setIsLoading(false);
      return;
    }
    
    (async () => {
      try {
        const response = await adminApi.get(`/api/admin/site-comments/${id}`).json<{ result: SiteCommentAdmin; }>();
        setSiteComment(response.result);
        
        setUserName(response.result.user_name || '');
        setContent(response.result.content);
      }
      catch(error) {
        setError(extractApiErrorMessage(error, 'コメントの取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [id]);
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
    const payload = {
      user_name: userName,
      content  : content
    };
    const parsed = adminUpdateSiteCommentSchema.safeParse(payload);
    if(!parsed.success) return setError(mergeIssues(parsed.error));
    
    try {
      await adminApi.put(`/api/admin/site-comments/${id}`, { json: parsed.data });
      navigate(`/admin/site-comment?id=${id}`);
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'コメントの編集に失敗しました'));
    }
  };
  
  const onDelete = async (): Promise<void> => {
    if(!window.confirm('本当にこのコメントを削除しますか？\nこの操作は取り消せません。')) return;
    
    setError('');
    try {
      await adminApi.delete(`/api/admin/site-comments/${id}`);
      navigate('/admin/site-comments?page=1');
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'コメントの削除に失敗しました'));
    }
  };
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>サイト別コメント編集・削除</h1>
      
      {isLoading ? (
        <p className="loading">読み込み中…</p>
      ) : !isEmpty(loadError) ? (
        <p className="text-error">{loadError}</p>
      ) : siteComment == null ? (
        <p className="text-error">コメントが見つかりませんでした。</p>
      ) : (
        <form onSubmit={onSubmit}>
          <label>
            <div className="form-label">ID</div>
            <div>{siteComment.id}</div>
          </label>
          <label>
            <div className="form-label">サイト ID</div>
            <div><Link to={{ pathname: '/admin/site', search: `?id=${siteComment.site_id}` }}>{siteComment.site_id}</Link></div>
          </label>
          <label>
            <div className="form-label">IP アドレス</div>
            <div>{siteComment.ip}</div>
          </label>
          <label>
            <div className="form-label">投稿日時</div>
            <div>{convertUtcToJst(siteComment.created_at)}</div>
          </label>
          
          <label>
            <div className="form-label">{userNameDisplayName} <span className="form-label-memo">(任意・{userNameMaxLength}文字以内)</span></div>
            <input type="text" placeholder={userNameDisplayName} value={userName} maxLength={userNameMaxLength} onChange={event => setUserName(event.target.value)} />
          </label>
          
          <label>
            <div className="form-label">{commentDisplayName} <span className="form-label-memo">(必須・{commentMaxLength}文字以内)</span></div>
            <textarea placeholder={commentDisplayName} value={content} maxLength={commentMaxLength} onChange={event => setContent(event.target.value)} required rows={6} />
          </label>
          
          {!isEmpty(error) && (<p className="text-error">{error}</p>)}
          
          <p><button type="submit">編集</button></p>
          
          <p className="form-delete text-right"><button type="button" onClick={onDelete}>削除</button></p>
        </form>
      )}
    </main>
  );
}
