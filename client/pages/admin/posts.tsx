import { isHTTPError } from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { adminApi } from '../../helpers/admin-api';
import { removeJwt } from '../../helpers/admin-auth';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { PostAdmin } from '../../../shared/types/post';

export default function AdminPosts(): ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const pageParam = searchParams.get('page');
  const pageNumber = pageParam == null ? 1 : Number(pageParam);
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  const [posts, setPosts] = useState<Array<PostAdmin>>([]);
  const [hasNext, setHasNext] = useState(false);
  const [siteId, setSiteId] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fetchPosts = async (): Promise<void> => {
    setError('');
    setIsLoading(true);
    try {
      const response = await adminApi.get(`/api/admin/posts?page=${page}`).json<{ result: { page: number; posts: Array<PostAdmin>; has_next: boolean; } }>();
      setPosts(response.result.posts);
      setHasNext(response.result.has_next);
    }
    catch(error) {
      if(isHTTPError(error) && error.response.status === 401) {
        removeJwt();
        navigate('/admin', { replace: true });
        return;
      }
      setError(extractApiErrorMessage(error, '投稿一覧の取得に失敗しました'));
    }
    finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    void fetchPosts();
  }, [navigate, page]);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const requestBody: { site_id?: number; content: string } = {
        content
      };
      const parsedSiteId = Number(siteId);
      if(siteId !== '' && Number.isInteger(parsedSiteId) && parsedSiteId > 0) {
        requestBody.site_id = parsedSiteId;
      }
      
      await adminApi.post('/api/admin/posts', { json: requestBody });
      setSiteId('');
      setContent('');
      await fetchPosts();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '投稿の送信に失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>投稿管理</h1>
      
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          サイト ID
          <input
            type="text"
            value={siteId}
            onChange={event => setSiteId(event.target.value)}
            placeholder="任意"
            disabled={isSubmitting}
          />
        </label>
        <label>
          本文
          <textarea
            value={content}
            onChange={event => setContent(event.target.value)}
            disabled={isSubmitting}
          />
        </label>
        <button type="submit" disabled={isSubmitting}>管理者投稿</button>
      </form>
      
      {error !== '' && <p className="text-error">{error}</p>}
      
      {isLoading ? (
        <p>読み込み中…</p>
      ) : posts.length === 0 ? (
        <p>投稿が見つかりませんでした。</p>
      ) : (
        <> 
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>サイト ID</th>
                <th>投稿者</th>
                <th>管理者</th>
                <th>投稿内容</th>
                <th>作成日時</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id}>
                  <td>{post.id}</td>
                  <td>{post.site_id ?? '-'}</td>
                  <td>{post.user_name ?? '-'}</td>
                  <td>{post.is_admin === 1 ? 'はい' : 'いいえ'}</td>
                  <td>{post.content}</td>
                  <td>{post.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div>
            {page > 1 && <Link to={`/admin/posts?page=${page - 1}`}>&laquo; 前のページ</Link>}
            {hasNext && <Link to={`/admin/posts?page=${page + 1}`}>次のページ &raquo;</Link>}
          </div>
        </>
      )}
    </main>
  );
}
