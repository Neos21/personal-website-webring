import ky from 'ky';
import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { newPostSchema, contentDisplayName, contentMaxLength, userNameDisplayName, userNameMaxLength } from '../../../shared/schemas/post-schema';
import { TurnstileField } from '../../components/turnstile-field';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { PostPublic } from '../../../shared/types/post';

export default function Support(): ReactElement {
  const [searchParams] = useSearchParams();
  
  const siteIdParam          = searchParams.get('id');
  const initialSiteId        = isEmpty(siteIdParam) ? null : Number(siteIdParam);
  const isValidInitialSiteId = isEmpty(siteIdParam) || (initialSiteId != null && Number.isInteger(initialSiteId) && initialSiteId > 0);
  
  const pageParam  = searchParams.get('page');
  const pageNumber = isEmpty(pageParam) ? 1 : Number(pageParam);
  const page       = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  const [posts    , setPosts    ] = useState<Array<PostPublic>>([]);
  const [hasNext  , setHasNext  ] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  const [formSiteId    , setFormSiteId    ] = useState<string>(initialSiteId != null ? String(initialSiteId) : '');
  const [lookupSiteInfo, setLookupSiteInfo] = useState<{ id: number; site_name: string; url: string; } | null>(null);
  const [lookupError   , setLookupError   ] = useState<string>('');
  const [userName      , setUserName      ] = useState<string>('');
  const [content       , setContent       ] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileKey  , setTurnstileKey  ] = useState<string>(String(Date.now()));  // `key` を変更すると Turnstile ウィジェットを再読み込みできる
  const [isSubmitting  , setIsSubmitting  ] = useState<boolean>(false);
  const [clientError   , setClientError   ] = useState<string>('');
  const [serverError   , setServerError   ] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  useEffect(() => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    if(!isValidInitialSiteId) {
      setError('サイト ID が不正です');
      setIsLoading(false);
      return;
    }
    
    (async () => {
      try {
        const query = new URLSearchParams();
        query.set('page', String(page));
        if(initialSiteId != null) query.set('id', String(initialSiteId));
        const response = await ky.get(`/api/posts?${query.toString()}`).json<{ result: { page: number; posts: Array<PostPublic>; has_next: boolean; }; }>();
        setPosts(response.result.posts);
        setHasNext(response.result.has_next);
      }
      catch(error) {
        const errorMessage = await extractApiErrorMessage(error, '投稿一覧の取得に失敗しました');
        setError(errorMessage);
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [page, siteIdParam, isValidInitialSiteId, initialSiteId]);
  
  const handleSiteIdBlur = async (): Promise<void> => {
    setLookupError('');
    setLookupSiteInfo(null);
    
    if(isEmpty(formSiteId)) {
      return;
    }
    
    const inputSiteId = Number(formSiteId);
    if(!Number.isInteger(inputSiteId) || inputSiteId <= 0) {
      setLookupError('サイト ID は正の整数で指定してください');
      return;
    }
    
    try {
      const response = await ky.get(`/api/sites/${inputSiteId}`).json<{ result: { id: number; site_name: string; url: string; }; }>();
      setLookupSiteInfo(response.result);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, 'サイト情報の取得に失敗しました');
      setLookupError(errorMessage);
    }
  };
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setClientError('');
    setServerError('');
    setSuccessMessage('');
    
    const submittedSiteId = isEmpty(formSiteId) ? null : Number(formSiteId);
    const isValidSubmittedSiteId = isEmpty(formSiteId) || (submittedSiteId != null && Number.isInteger(submittedSiteId) && submittedSiteId > 0);
    
    const payload = {
      site_id        : isValidSubmittedSiteId ? submittedSiteId : null,
      user_name      : userName || null,
      content        : content,
      turnstile_token: turnstileToken
    };
    const parsed = newPostSchema.safeParse(payload);
    if(!parsed.success) return setClientError(mergeIssues(parsed.error));
    
    setIsSubmitting(true);
    try {
      await ky.post('/api/posts', { json: parsed.data }).json();
      
      setUserName('');
      setContent('');
      setLookupSiteInfo(null);
      setTurnstileToken('');
      setTurnstileKey(String(Date.now()));
      setSuccessMessage('投稿が送信されました。');
      
      const submittedSiteId = isEmpty(formSiteId) ? null : Number(formSiteId);
      const query = new URLSearchParams();
      query.set('page', String(1));
      if(submittedSiteId != null) query.set('id', String(submittedSiteId));
      const response = await ky.get(`/api/posts?${query.toString()}`).json<{ result: { page: number; posts: Array<PostPublic>; has_next: boolean; }; }>();
      setPosts(response.result.posts);
      setHasNext(response.result.has_next);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '投稿の送信に失敗しました');
      setServerError(errorMessage);
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <main className="support-page page-container">
      <h1>サポート掲示板</h1>
      
      {initialSiteId != null ? (
        <p>このページはサイトID <strong>{initialSiteId}</strong> に関する投稿を表示します。</p>
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
                      {post.site_id != null && <span>
                        サイトID: <Link to={{ pathname: '/support', search: `?id=${post.site_id}` }}>{post.site_id}</Link>
                      </span>}
                    </div>
                    <div className="post-content pre-wrap" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</div>
                  </article>
                ))}
              </div>
            )}
            
            <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              {page > 1 && (
                <Link to={{ pathname: '/support', search: new URLSearchParams({ ...(initialSiteId != null ? { id: String(initialSiteId) } : {}), page: String(page - 1) }).toString() }}>&laquo; 前のページ</Link>
              )}
              
              {hasNext && (
                <Link to={{ pathname: '/support', search: new URLSearchParams({ ...(initialSiteId != null ? { id: String(initialSiteId) } : {}), page: String(page + 1) }).toString() }}>次のページ &raquo;</Link>
              )}
            </div>
          </section>
          
          <section className="post-form" style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', background: '#f8f8f8' }}>
            <h2>投稿する</h2>
            <form onSubmit={onSubmit}>
              <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>サイト ID <span style={{ color: '#666', fontSize: '0.9rem' }}>(任意)</span></div>
                  <input type="text" value={formSiteId} min="1" placeholder="サイト ID" onChange={event => setFormSiteId(event.target.value)} onBlur={handleSiteIdBlur} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
                </label>
                
                {!isEmpty(lookupError) && <p className="text-error">{lookupError}</p>}
                {lookupSiteInfo != null && (
                  <div style={{ padding: '1rem', marginBottom: '1rem', background: '#e8f5e9', borderRadius: '6px', border: '1px solid #81c784' }}>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>サイト名:</strong> <a href={lookupSiteInfo.url} target="_blank">{lookupSiteInfo.site_name}</a>
                    </p>
                  </div>
                )}
                
                <label style={{ display: 'block', marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>{userNameDisplayName} <span style={{ color: '#666', fontSize: '0.9rem' }}>(任意・{userNameMaxLength}文字以内)</span></div>
                  <input type="text" value={userName} maxLength={userNameMaxLength} placeholder={userNameDisplayName} onChange={event => setUserName(event.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
                </label>
                
                <label style={{ display: 'block', marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>{contentDisplayName} <span style={{ color: '#666', fontSize: '0.9rem' }}>(必須・{contentMaxLength}文字以内)</span></div>
                  <textarea value={content} maxLength={contentMaxLength} placeholder={contentDisplayName} onChange={event => setContent(event.target.value)} required rows={6} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
                </label>
                
                <div style={{ marginBottom: '1rem' }}>
                  <TurnstileField key={turnstileKey} onTokenChange={setTurnstileToken} />
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
          
          {initialSiteId != null && (
            <p style={{ marginTop: '2rem' }}>
              <Link to={{ pathname: '/site', search: `?id=${initialSiteId}` }}>このサイトの詳細に戻る</Link>
            </p>
          )}
        </>
      )}
      
      <p className="text-right" style={{ marginTop: '2rem' }}>
        <Link to="/">トップへ戻る</Link>
      </p>
    </main>
  );
}
