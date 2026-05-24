import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { adminUpdatePostSchema } from '../../../shared/schemas/admin/admin-post-schema';
import { contentDisplayName, contentMaxLength, siteIdDisplayName, userNameDisplayName, userNameMaxLength } from '../../../shared/schemas/post-schema';
import { adminApi } from '../../helpers/admin-api';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { PostAdmin } from '../../../shared/types/admin/admin-post';

export default function AdminPost(): ReactElement {
  const location = useLocation();
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
    setIsLoading(true);
    
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
  }, [location.key, id]);
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
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
    
    try {
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
    <main>
      <title>投稿編集・削除 - 個人サイトウェブリング</title>
      <h1>投稿編集・削除</h1>
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : !isEmpty(loadError) ? (
        <div className="mb-8 p-4 font-bold text-red-600 bg-red-50">{loadError}</div>
      ) : post == null ? (
        <div className="mb-8 p-4 font-bold text-red-600 bg-red-50">投稿が見つかりませんでした</div>
      ) : (
        <form className="mb-8 space-y-4" onSubmit={onSubmit}>
          <table>
            <tbody>
              <tr>
                <th>ID</th>
                <td className="w-full">{post.id}</td>
              </tr>
              <tr>
                <th>IP アドレス</th>
                <td className="w-full">{post.ip}</td>
              </tr>
              <tr>
                <th>投稿日時</th>
                <td className="w-full">{convertUtcToJst(post.created_at)}</td>
              </tr>
            </tbody>
          </table>
          
          <label className="space-y-1">
            <div><span className="font-bold">{siteIdDisplayName}</span> <span className="ml-2 text-slate-500 text-sm">(任意)</span></div>
            <input type="text" placeholder={siteIdDisplayName} value={siteId} onChange={event => setSiteId(event.target.value)} />
          </label>
          
          <label className="space-y-1">
            <div><span className="font-bold">{userNameDisplayName}</span> <span className="ml-2 text-slate-500 text-sm">(任意・{userNameMaxLength}文字以内)</span></div>
            <input type="text" placeholder={userNameDisplayName} value={userName} maxLength={userNameMaxLength} onChange={event => setUserName(event.target.value)} />
          </label>
          
          <label className="space-y-1">
            <div><span className="font-bold">{contentDisplayName}</span> <span className="ml-2 text-slate-500 text-sm">(必須・{contentMaxLength}文字以内)</span></div>
            <textarea placeholder={contentDisplayName} value={content} maxLength={contentMaxLength} onChange={event => setContent(event.target.value)} required rows={4} />
          </label>
          
          <label className={`cursor-pointer ${isAdmin === 1 ? 'font-bold' : ''}`}>
            <input type="checkbox" checked={isAdmin === 1} onChange={() => setIsAdmin(prevIsAdmin => prevIsAdmin === 1 ? 0 : 1)} /> リングマスター投稿
          </label>
          
          {!isEmpty(error) && (<div className="p-4 font-bold text-red-600 bg-red-50">{error}</div>)}
          
          <div><button type="submit">編集</button></div>
          
          <div className="form-danger text-right"><button type="button" onClick={onDelete}>物理削除する</button></div>
        </form>
      )}
      
      <div className="text-right"><Link to={{ pathname: '/admin/posts', search: '?page=1' }}>サポート掲示板投稿管理</Link> | <Link to="/admin/dashboard">ダッシュボード</Link> | <Link to="/">トップ</Link></div>
    </main>
  );
}
