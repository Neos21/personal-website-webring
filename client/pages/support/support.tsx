import ky from 'ky';
import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { supportPostSchema, contentDisplayName, contentMaxLength, userNameDisplayName, userNameMaxLength } from '../../../shared/schemas/support-post-schema';
import { TurnstileField } from '../../components/turnstile-field';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { PostPublic } from '../../../shared/types/post';

export default function Support(): ReactElement {
  const [searchParams] = useSearchParams();
  
  const rawSiteId = searchParams.get('id');
  const rawPage   = searchParams.get('page');
  const pageCandidate = isEmpty(rawPage) ? 1 : Number(rawPage);
  const page = Number.isInteger(pageCandidate) && pageCandidate > 0 ? pageCandidate : 1;
  const siteId = isEmpty(rawSiteId) ? null : Number(rawSiteId);
  const isSiteIdValid = isEmpty(rawSiteId) || (siteId != null && Number.isInteger(siteId) && siteId > 0);
  
  const [posts    , setPosts    ] = useState<Array<PostPublic>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  const [userName      , setUserName      ] = useState<string>('');
  const [content       , setContent       ] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [isSubmitting  , setIsSubmitting  ] = useState<boolean>(false);
  const [clientError   , setClientError   ] = useState<string>('');
  const [serverError   , setServerError   ] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      
      if(!isSiteIdValid) {
        setError('サイト ID が不正です');
        setIsLoading(false);
        return;
      }
      
      const query = new URLSearchParams();
      query.set('page', String(page));
      if(siteId != null) query.set('id', String(siteId));
      
      try {
        const response = await ky.get(`/api/posts?${query.toString()}`).json<{ result: { page: number; posts: Array<PostPublic>; }; }>();
        setPosts(response.result.posts);
      }
      catch(error) {
        const errorMessage = await extractApiErrorMessage(error, '投稿一覧の取得に失敗しました');
        setError(errorMessage);
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [page, rawSiteId, isSiteIdValid, siteId]);
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setClientError('');
    setServerError('');
    setSuccessMessage('');
    
    const payload: { site_id?: number | null; user_name?: string | null; content: string; turnstile_token: string; } = {
      content,
      turnstile_token: turnstileToken,
      user_name: userName || null
    };
    if(siteId != null && isSiteIdValid) payload.site_id = siteId;
    
    const parsedResult = supportPostSchema.safeParse(payload);
    if(!parsedResult.success) {
      setClientError(mergeIssues(parsedResult.error));
      return;
    }
    
    setIsSubmitting(true);
    try {
      await ky.post('/api/posts', { json: parsedResult.data }).json();
      setUserName('');
      setContent('');
      setTurnstileToken('');
      setSuccessMessage('投稿が送信されました。');
      
      const query = new URLSearchParams();
      query.set('page', String(page));
      if(siteId != null) query.set('id', String(siteId));
      const response = await ky.get(`/api/posts?${query.toString()}`).json<{ result: { page: number; posts: Array<PostPublic>; }; }>();
      setPosts(response.result.posts);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '投稿の送信に失敗しました');
      setServerError(errorMessage);
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  const hasNextPage = posts.length === 100;
  const currentQuery = new URLSearchParams();
  if(siteId != null) currentQuery.set('id', String(siteId));
  
  return (
    <main className="support-page page-container">
      <h1>サポート掲示板</h1>
      
      {siteId != null ? (
        <p>このページはサイトID <strong>{siteId}</strong> に関する投稿を表示します。</p>
      ) : (
        <p>全体のサポート掲示板投稿を表示します。</p>
      )}
      
      {isLoading ? (
        <p>読み込み中…</p>
      ) : !isEmpty(error) ? (
        <p className="text-error">{error}</p>
      ) : (
        <>
          <section className="post-list" style={{ marginBottom: '2rem' }}>
            <h2>投稿一覧</h2>
            
            {posts.length === 0 ? (
              <p>投稿はまだありません。</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {posts.map(post => (
                  <article key={post.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.9rem', color: '#555' }}>
                      <span>{post.user_name || '名無し'}</span>
                      <span>投稿日: {convertUtcToJst(post.created_at)}</span>
                      {post.site_id != null && <span>サイトID: {post.site_id}</span>}
                    </div>
                    <div className="post-content pre-wrap" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</div>
                  </article>
                ))}
              </div>
            )}
            
            <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              {page > 1 ? (
                <Link to={`/support?${new URLSearchParams({ ...(siteId != null ? { id: String(siteId) } : {}), page: String(page - 1) }).toString()}`}>&laquo; 前のページ</Link>
              ) : (
                <span />
              )}
              
              {hasNextPage ? (
                <Link to={`/support?${new URLSearchParams({ ...(siteId != null ? { id: String(siteId) } : {}), page: String(page + 1) }).toString()}`}>次のページ &raquo;</Link>
              ) : (
                <span />
              )}
            </div>
          </section>
          
          <section className="post-form" style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', background: '#f8f8f8' }}>
            <h2>投稿する</h2>
            <form onSubmit={onSubmit}>
              <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>{userNameDisplayName} <span style={{ color: '#666', fontSize: '0.9rem' }}>(任意・{userNameMaxLength}文字以内)</span></div>
                  <input type="text" value={userName} maxLength={userNameMaxLength} placeholder={userNameDisplayName} onChange={event => setUserName(event.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
                </label>
                
                <label style={{ display: 'block', marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>{contentDisplayName} <span style={{ color: '#666', fontSize: '0.9rem' }}>(必須・{contentMaxLength}文字以内)</span></div>
                  <textarea value={content} maxLength={contentMaxLength} placeholder={contentDisplayName} onChange={event => setContent(event.target.value)} required rows={6} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
                </label>
                
                <div style={{ marginBottom: '1rem' }}>
                  <TurnstileField onTokenChange={setTurnstileToken} />
                </div>
                
                {clientError && <p className="text-error">{clientError}</p>}
                {serverError && <p className="text-error">{serverError}</p>}
                {successMessage && <p className="text-success">{successMessage}</p>}
                
                <p>
                  <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', background: '#0070f3', color: '#fff', cursor: isSubmitting ? 'default' : 'pointer' }}>
                    {isSubmitting ? '送信中…' : '投稿する'}
                  </button>
                </p>
              </fieldset>
            </form>
          </section>
        </>
      )}
      
      <p className="text-right" style={{ marginTop: '2rem' }}>
        <Link to="/">トップへ戻る</Link>
      </p>
    </main>
  );
}
