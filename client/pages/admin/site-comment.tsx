import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { adminUpdateSiteCommentSchema } from '../../../shared/schemas/admin/admin-site-comment-schema';
import { commentDisplayName, commentMaxLength, userNameDisplayName, userNameMaxLength } from '../../../shared/schemas/site-comment-schema';
import { adminApi } from '../../helpers/admin-api';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SiteCommentAdmin } from '../../../shared/types/admin/admin-site-comment';

export default function AdminSiteComment(): ReactElement {
  const location = useLocation();
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
    (async () => {
      setIsLoading(true);
      
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
  }, [location.key, id]);
  
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
    <main>
      <title>サイト別コメント編集・削除 - 個人サイトウェブリング</title>
      <h1>サイト別コメント編集・削除</h1>
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : !isEmpty(loadError) ? (
        <div className="alert-danger mb-8 font-bold">{loadError}</div>
      ) : siteComment == null ? (
        <div className="alert-danger mb-8 font-bold">コメントが見つかりませんでした</div>
      ) : (
        <form className="mb-8 space-y-4" onSubmit={onSubmit}>
          <table>
            <tbody>
              <tr>
                <th>ID</th>
                <td className="w-full">{siteComment.id}</td>
              </tr>
              <tr>
                <th>サイト ID</th>
                <td className="w-full"><Link to={{ pathname: '/admin/site', search: `?id=${siteComment.site_id}` }}>{siteComment.site_id}</Link></td>
              </tr>
              <tr>
                <th>IP アドレス</th>
                <td className="w-full">{siteComment.ip}</td>
              </tr>
              <tr>
                <th>投稿日時</th>
                <td className="w-full">{convertUtcToJst(siteComment.created_at)}</td>
              </tr>
            </tbody>
          </table>
          
          <label>
            <div><span className="font-bold">{userNameDisplayName}</span> <span className="form-label-memo">(任意・{userNameMaxLength}文字以内)</span></div>
            <input type="text" placeholder={userNameDisplayName} value={userName} maxLength={userNameMaxLength} onChange={event => setUserName(event.target.value)} />
          </label>
          
          <label>
            <div><span className="font-bold">{commentDisplayName}</span> <span className="form-label-memo">(必須・{commentMaxLength}文字以内)</span></div>
            <textarea placeholder={commentDisplayName} value={content} maxLength={commentMaxLength} onChange={event => setContent(event.target.value)} required rows={4} />
          </label>
          
          {!isEmpty(error) && (<div className="alert-danger font-bold">{error}</div>)}
          
          <div><button type="submit">編集</button></div>
          
          <div className="form-danger text-right"><button type="button" onClick={onDelete}>物理削除する</button></div>
        </form>
      )}
      
      <div className="text-right"><Link to={{ pathname: '/admin/site-comments', search: '?page=1' }}>サイト別コメント管理</Link> | <Link to="/admin/dashboard">ダッシュボード</Link> | <Link to="/">トップ</Link></div>
    </main>
  );
}
