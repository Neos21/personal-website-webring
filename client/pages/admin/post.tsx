import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { adminUpdatePostSchema } from '../../../shared/schemas/admin/admin-post-schema';
import { contentDisplayName, contentMaxLength, siteIdDisplayName, userNameDisplayName, userNameMaxLength } from '../../../shared/schemas/post-schema';
import { adminApi } from '../../helpers/admin-api';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { PostAdmin } from '../../../shared/types/admin/admin-post';

export default function AdminPost(): ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // サイト ID パラメータ (必須)
  const idParam = searchParams.get('id');
  const id      = isEmpty(idParam) ? null : Number(idParam);
  
  // 投稿詳細 (表示専用)
  const [post, setPost] = useState<PostAdmin | null>(null);
  
  // 入力フォーム
  const [siteId  , setSiteId  ] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [content , setContent ] = useState<string>('');
  const [isAdmin , setIsAdmin ] = useState<0 | 1>(0);
  
  // エラー表示系
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const [error    , setError    ] = useState<string>('');
  
  useEffect(() => {
    if(id == null) {
      setLoadError('サイト ID が指定されていません');
      setIsLoading(false);
      return;
    }
    if(!Number.isInteger(id) || id <= 0) {
      setLoadError('サイト ID が不正です');
      setIsLoading(false);
      return;
    }
    
    (async () => {
      try {
        const response = await adminApi.get(`/api/admin/posts/${id}`).json<{ result: PostAdmin; }>();
        setPost(response.result);
        
        setSiteId(isEmpty(response.result.site_id) ? '' : String(response.result.site_id));
        setUserName(response.result.user_name || '');
        setContent(response.result.content);
        setIsAdmin(response.result.is_admin);
      }
      catch(error) {
        setError(extractApiErrorMessage(error, '投稿の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [id]);
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
    try {
      const submittedSiteId        = isEmpty(siteId) ? null : Number(siteId);
      const isValidSubmittedSiteId = isEmpty(siteId) || (submittedSiteId != null && Number.isInteger(submittedSiteId) && submittedSiteId > 0);
      
      const payload = {
        site_id  : isValidSubmittedSiteId ? submittedSiteId : null,
        user_name: userName,
        content  : content,
        is_admin : isAdmin
      };
      const parsed = adminUpdatePostSchema.safeParse(payload);
      if(!parsed.success) return setError(mergeIssues(parsed.error));
      
      await adminApi.put(`/api/admin/posts/${id}`, { json: parsed.data });
      navigate(`/admin/post?id=${id}`);
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '投稿の編集に失敗しました'));
    }
  };
  
  const onDelete = async (): Promise<void> => {
    if(!window.confirm('本当にこの投稿を削除しますか？\nこの操作は取り消せません。')) return;
    
    setError('');
    try {
      await adminApi.delete(`/api/admin/posts/${id}`);
      navigate('/admin/posts?page=1');
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '投稿の削除に失敗しました'));
    }
  };
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>投稿編集・削除</h1>
      
      {isLoading ? (
        <p className="loading">読み込み中…</p>
      ) : !isEmpty(loadError) ? (
        <p className="text-error">{loadError}</p>
      ) : post == null ? (
        <p className="text-error">投稿が見つかりませんでした。</p>
      ) : (
        <form onSubmit={onSubmit}>
          <label>
            <div className="form-label">ID</div>
            <div>{post.id}</div>
          </label>
          <label>
            <div className="form-label">IP アドレス</div>
            <div>{post.ip}</div>
          </label>
          <label>
            <div className="form-label">登録日時</div>
            <div>{convertUtcToJst(post.created_at)}</div>
          </label>
          
          <label>
            <div className="form-label">{siteIdDisplayName} <span className="form-label-memo">(任意)</span></div>
            <input type="text" placeholder={siteIdDisplayName} value={siteId} onChange={event => setSiteId(event.target.value)} />
          </label>
          
          <label>
            <div className="form-label">{userNameDisplayName} <span className="form-label-memo">(任意・{userNameMaxLength}文字以内)</span></div>
            <input type="text" placeholder={userNameDisplayName} value={userName} maxLength={userNameMaxLength} onChange={event => setUserName(event.target.value)} />
          </label>
          
          <label>
            <div className="form-label">{contentDisplayName} <span className="form-label-memo">(必須・{contentMaxLength}文字以内)</span></div>
            <textarea placeholder={contentDisplayName} value={content} maxLength={contentMaxLength} onChange={event => setContent(event.target.value)} required rows={6} />
          </label>
          
          <label>
            <div className="form-label"><input type="checkbox" checked={isAdmin === 1} onChange={event => setIsAdmin(event.target.checked ? 1 : 0)} /> 管理者投稿</div>
          </label>
          
          {!isEmpty(error) && (<p className="text-error">{error}</p>)}
          
          <p><button type="submit">編集</button></p>
          
          <p className="form-delete text-right"><button type="button" onClick={onDelete}>削除</button></p>
        </form>
      )}
    </main>
  );
}
