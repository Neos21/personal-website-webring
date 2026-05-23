import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useSearchParams } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { adminNewPostSchema } from '../../../shared/schemas/admin/admin-post-schema';
import { contentDisplayName, contentMaxLength, siteIdDisplayName, userNameDisplayName, userNameMaxLength } from '../../../shared/schemas/post-schema';
import { adminApi } from '../../helpers/admin-api';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { PostAdmin } from '../../../shared/types/admin/admin-post';

export default function AdminPosts(): ReactElement {
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
  const [userName    , setUserName    ] = useState<string>('');
  const [content     , setContent     ] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  useEffect(() => {
    fetchPosts();
  }, [page]);
  
  const fetchPosts = async (): Promise<void> => {
    setError('');
    setIsLoading(true);
    
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
  };
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const submittedSiteId        = isEmpty(siteId) ? null : Number(siteId);
      const isValidSubmittedSiteId = isEmpty(siteId) || (submittedSiteId != null && Number.isInteger(submittedSiteId) && submittedSiteId > 0);
      
      const payload = {
        site_id  : isValidSubmittedSiteId ? submittedSiteId : null,
        user_name: userName,
        content  : content
      };
      const parsed = adminNewPostSchema.safeParse(payload);
      
      await adminApi.post('/api/admin/posts', { json: parsed.data });
      setSiteId('');
      setContent('');
      await fetchPosts();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '投稿に失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>サポート掲示板</h1>
      
      <form onSubmit={onSubmit}>
        <label>
          <div className="form-label">{siteIdDisplayName} <span className="form-label-memo">(任意)</span></div>
          <input type="text" placeholder={siteIdDisplayName} value={siteId} onChange={event => setSiteId(event.target.value)} />
        </label>
        <label>
          <div className="form-label">{userNameDisplayName} <span className="form-label-memo">(必須・{userNameMaxLength}文字以内)</span></div>
          <input type="text" placeholder={userNameDisplayName} value={userName} maxLength={userNameMaxLength} onChange={event => setUserName(event.target.value)} />
        </label>
        <label>
          <div className="form-label">{contentDisplayName}</div>
          <textarea placeholder={contentDisplayName} value={content} maxLength={contentMaxLength} onChange={event => setContent(event.target.value)} required rows={6} />
        </label>
        <p><button type="submit" disabled={isSubmitting}>管理者投稿</button></p>
      </form>
      
      {!isEmpty(error) && (<p className="text-error">{error}</p>)}
      
      {isLoading ? (
        <p className="loading">読み込み中…</p>
      ) : posts.length === 0 ? (
        <p>投稿はありません。</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>{siteIdDisplayName}</th>
              <th>{userNameDisplayName}</th>
              <th>{contentDisplayName}</th>
              <th>投稿日時</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id} className={post.is_admin === 1 ? 'row-admin' : ''}>
                <td className="nowrap">{post.id}</td>
                <td className="nowrap">{isEmpty(post.site_id) ? '-' : (<Link to={{ pathname: '/admin/site', search: `?id=${post.site_id}` }}>{post.site_id}</Link>)}</td>
                <td>{post.user_name || '-'}</td>
                <td className="pre-wrap">{post.content}</td>
                <td className="nowrap">{convertUtcToJst(post.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {(page > 1 || hasNext) && (
        <p className="text-center">
          {page > 1            && (<Link to={{ pathname: '/admin/posts', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>)}
          {page > 1 && hasNext && (<span className="text-muted"> | </span>)}
          {hasNext             && (<Link to={{ pathname: '/admin/posts', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>)}
        </p>
      )}
    </main>
  );
}
