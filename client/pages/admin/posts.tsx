import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { adminNewPostSchema } from '../../../shared/schemas/admin/admin-post-schema';
import { contentDisplayName, contentMaxLength, siteIdDisplayName, userNameDisplayName, userNameMaxLength } from '../../../shared/schemas/post-schema';
import { adminApi } from '../../helpers/admin-api';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';
import { useAdminStore } from '../../stores/admin-store';

import type { PostAdmin } from '../../../shared/types/admin/admin-post';

export default function AdminPosts(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // ページング
  const pageParam  = searchParams.get('page');
  const pageNumber = isEmpty(pageParam) ? 1 : Number(pageParam);
  const page       = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  // エラー表示系
  const [error, setError] = useState<string>('');
  
  // 一覧
  const [posts    , setPosts    ] = useState<Array<PostAdmin>>([]);
  const [hasNext  , setHasNext  ] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 投稿フォーム
  const [siteId      , setSiteId      ] = useState<string>('');
  const [userName    , setUserName    ] = useState<string>(useAdminStore.getState().supportUserName || '');
  const [content     , setContent     ] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  useEffect(() => {
    setIsLoading(true);
    setError('');
    setPosts([]);
    setSiteId('');
    setContent('');
    setIsSubmitting(false);
    
    // URL に `page=1` がなければ再読込する
    const currentPageNumber = Number(pageParam);
    const needsPageFix = isEmpty(pageParam) || !Number.isInteger(currentPageNumber) || currentPageNumber <= 0;
    if(needsPageFix) {
      navigate('/admin/posts?page=1', { replace: true });
      return;
    }
    
    (async () => {
      try {
        const response = await adminApi.get(`/api/admin/posts?page=${page}`).json<{ result: { page: number; posts: Array<PostAdmin>; has_next: boolean; }; }>();
        setPosts(response.result.posts);
        setHasNext(response.result.has_next);
      }
      catch(error) {
        setError(extractApiErrorMessage(error, '投稿一覧の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [location.key, navigate, pageParam, page]);
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
    const submittedSiteId        = isEmpty(siteId) ? null : Number(siteId);
    const isValidSubmittedSiteId = isEmpty(siteId) || (submittedSiteId != null && Number.isInteger(submittedSiteId) && submittedSiteId > 0);
    
    const payload = {
      site_id  : isValidSubmittedSiteId ? submittedSiteId : null,
      user_name: userName,
      content  : content
    };
    const parsed = adminNewPostSchema.safeParse(payload);
    if(!parsed.success) return setError(mergeIssues(parsed.error));
    
    setIsSubmitting(true);
    try {
      await adminApi.post('/api/admin/posts', { json: parsed.data });
      
      useAdminStore.getState().setSupportUserName(parsed.data.user_name || '');
      setContent('');
      
      navigate('/admin/posts?page=1');
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'リングマスター投稿に失敗しました'));
      setIsSubmitting(false);
    }
  };
  
  return (
    <main>
      <title>サポート掲示板投稿管理 - 個人サイトウェブリング</title>
      <h1>サポート掲示板投稿管理</h1>
      
      <form className="mb-8 space-y-4" onSubmit={onSubmit}>
        <label className="space-y-1">
          <div><span className="font-bold">{siteIdDisplayName}</span> <span className="ml-2 text-slate-500 text-sm">(任意)</span></div>
          <input type="text" placeholder={siteIdDisplayName} value={siteId} onChange={event => setSiteId(event.target.value)} />
        </label>
        
        <label className="space-y-1">
          <div><span className="font-bold">{userNameDisplayName}</span> <span className="ml-2 text-slate-500 text-sm">(必須・{userNameMaxLength}文字以内)</span></div>
          <input type="text" placeholder={userNameDisplayName} value={userName} maxLength={userNameMaxLength} onChange={event => setUserName(event.target.value)} required />
        </label>
        
        <label className="space-y-1">
          <div><span className="font-bold">{contentDisplayName}</span> <span className="ml-2 text-slate-500 text-sm">(必須・{contentMaxLength}文字以内)</span></div>
          <textarea placeholder={contentDisplayName} value={content} maxLength={contentMaxLength} onChange={event => setContent(event.target.value)} required rows={4} />
        </label>
        
        <div><button type="submit" disabled={isSubmitting}>リングマスター投稿</button></div>
      </form>
      
      {!isEmpty(error) && (<div className="mb-8 p-4 font-bold text-red-600 bg-red-50">{error}</div>)}
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : posts.length === 0 ? (
        <>
          <div className="mb-8 text-slate-500 text-sm">まだ投稿はありません。</div>
          {(page > 1 || hasNext) && (
            <div className="mb-8 space-x-2 text-sm text-center">
              {page > 1            && (<Link to={{ pathname: '/admin/posts', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-slate-500"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/admin/posts', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-8 overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>サイト ID</th>
                  <th>HN</th>
                  <th>本文</th>
                  <th>投稿日時</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id} className={post.is_admin === 1 ? '[&>td]:bg-emerald-50' : ''}>  {/* eslint-disable-line neos-eslint-plugin/comment-colon-spacing */}
                    <td className="font-bold text-right whitespace-nowrap"><Link to={{ pathname: '/admin/post', search: `?id=${post.id}` }}>{post.id}</Link></td>
                    <td className="          text-right whitespace-nowrap">{isEmpty(post.site_id) ? '-' : (<Link to={{ pathname: '/admin/site', search: `?id=${post.site_id}` }}>{post.site_id}</Link>)}</td>
                    <td className="min-w-25        text-sm">{post.user_name || '-'}</td>
                    <td className="min-w-40 w-full text-sm whitespace-pre-wrap">{post.content}</td>
                    <td className="                text-sm whitespace-nowrap">{convertUtcToJst(post.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {(page > 1 || hasNext) && (
            <div className="mb-8 space-x-2 text-sm text-center">
              {page > 1            && (<Link to={{ pathname: '/admin/posts', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
              {page > 1 && hasNext && (<span className="text-slate-500"> | </span>)}
              {hasNext             && (<Link to={{ pathname: '/admin/posts', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
            </div>
          )}
        </>
      )}
      
      <div className="text-right"><Link to="/admin/dashboard">ダッシュボード</Link> | <Link to="/">トップ</Link></div>
    </main>
  );
}
