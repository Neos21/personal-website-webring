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
import type { SiteNameUrl } from '../../../shared/types/site';

export default function Support(): ReactElement {
  const [searchParams] = useSearchParams();
  
  // サイト ID パラメータ (任意)
  const siteIdParam          = searchParams.get('id');
  const initialSiteId        = isEmpty(siteIdParam) ? null : Number(siteIdParam);
  const isValidInitialSiteId = isEmpty(siteIdParam) || (initialSiteId != null && Number.isInteger(initialSiteId) && initialSiteId > 0);
  
  // ページング
  const pageParam  = searchParams.get('page');
  const pageNumber = isEmpty(pageParam) ? 1 : Number(pageParam);
  const page       = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  // 投稿一覧
  const [posts    , setPosts    ] = useState<Array<PostPublic>>([]);
  const [hasNext  , setHasNext  ] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  // 投稿フォーム
  const [formSiteId    , setFormSiteId    ] = useState<string>(initialSiteId != null ? String(initialSiteId) : '');
  const [userName      , setUserName      ] = useState<string>('');
  const [content       , setContent       ] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileKey  , setTurnstileKey  ] = useState<string>(String(Date.now()));  // `key` を変更すると Turnstile ウィジェットを再読み込みできる
  
  // エラー表示系
  const [lookupSite  , setLookupSite  ] = useState<SiteNameUrl | null>(null);
  const [lookupError , setLookupError ] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [clientError , setClientError ] = useState<string>('');
  const [serverError , setServerError ] = useState<string>('');
  
  useEffect(() => {
    setIsLoading(true);
    setError('');
    
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
        // TODO : URL に ?id や ?page を反映する
      }
      catch(error) {
        setError(extractApiErrorMessage(error, '投稿一覧の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [page, siteIdParam, isValidInitialSiteId, initialSiteId]);
  
  const onBlurSiteId = async (): Promise<void> => {
    // TODO : Blur 時に毎回コレだとチラつくので要調整
    setLookupError('');
    setLookupSite(null);
    
    if(isEmpty(formSiteId)) return;
    
    const inputSiteId = Number(formSiteId);
    if(!Number.isInteger(inputSiteId) || inputSiteId <= 0) return setLookupError('サイト ID は正の整数で指定してください');
    
    try {
      const response = await ky.get(`/api/sites/${inputSiteId}`).json<{ result: SiteNameUrl; }>();
      setLookupSite(response.result);
    }
    catch(error) {
      setLookupError(extractApiErrorMessage(error, 'サイト情報の取得に失敗しました'));
    }
  };
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setClientError('');
    setServerError('');
    
    const submittedSiteId        = isEmpty(formSiteId) ? null : Number(formSiteId);
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
      
      setContent('');
      setLookupSite(null);
      setTurnstileToken('');
      setTurnstileKey(String(Date.now()));
      
      // 投稿したサイト ID に基づいて1ページ目を再読込する
      const submittedSiteId = isEmpty(formSiteId) ? null : Number(formSiteId);
      const query = new URLSearchParams();
      query.set('page', String(1));
      if(submittedSiteId != null) query.set('id', String(submittedSiteId));
      const response = await ky.get(`/api/posts?${query.toString()}`).json<{ result: { page: number; posts: Array<PostPublic>; has_next: boolean; }; }>();
      setPosts(response.result.posts);
      setHasNext(response.result.has_next);
      // TODO : URL のパラメータ、および `initialSiteId` が書き換わらなさそうなので書き換えたい
      // TODO : ページトップに移動させたい
    }
    catch(error) {
      setServerError(extractApiErrorMessage(error, '投稿の送信に失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <main className="page-container">
      <h1>サポート掲示板</h1>
      
      {initialSiteId != null ? (
        <>
          <p><Link to={{ pathname: '/site', search: `?id=${initialSiteId}` }}>サイト ID [{initialSiteId}]</Link> に関する投稿のみ絞り込み表示しています。</p>
          <p><Link to="/support">全体のサポート掲示板投稿を見る場合はコチラ</Link></p>
        </>
      ) : (
        <p>当サイトに関するご意見・お問い合わせなどがありましたらコチラにドウゾ。</p>
      )}
      
      {isLoading ? (
        <p className="loading">読み込み中…</p>
      ) : !isEmpty(error) ? (
        <p className="text-error">{error}</p>
      ) : (
        <>
          <form onSubmit={onSubmit}>
            <fieldset>
              <legend>投稿する</legend>
              
              <label>
                <div className="form-label">サイト ID <span className="form-label-memo">(特定サイトに関するお問合せの場合は入力)</span></div>
                <input type="text" placeholder="サイト ID" value={formSiteId} onChange={event => setFormSiteId(event.target.value)} onBlur={onBlurSiteId} />
              </label>
              {lookupSite != null && (
                <div className="lookup-site"><strong>サイト名</strong> : <Link to={{ pathname: '/site', search: `?id=${lookupSite.id}` }}>{lookupSite.site_name}</Link></div>
              )}
              {!isEmpty(lookupError) && (<p className="text-error">{lookupError}</p>)}
              
              <label>
                <div className="form-label">{userNameDisplayName} <span className="form-label-memo">(任意・{userNameMaxLength}文字以内)</span></div>
                <input type="text" placeholder={userNameDisplayName} value={userName} maxLength={userNameMaxLength} onChange={event => setUserName(event.target.value)} />
              </label>
              
              <label>
                <div className="form-label">{contentDisplayName} <span className="form-label-memo">(必須・{contentMaxLength}文字以内)</span></div>
                <textarea placeholder={contentDisplayName} value={content} maxLength={contentMaxLength} onChange={event => setContent(event.target.value)} required rows={6} />
              </label>
              
              <TurnstileField key={turnstileKey} onTokenChange={setTurnstileToken} />
              
              {clientError && (<p className="text-error">{clientError}</p>)}
              {serverError && (<p className="text-error">{serverError}</p>)}
              
              <p><button type="submit" disabled={isSubmitting}>{isSubmitting ? '送信中…' : '投稿する'}</button></p>
            </fieldset>
          </form>
          
          {posts.length === 0 ? (
            <>
              <p>投稿はまだありません。</p>
              {(page > 1 || hasNext) && (
                <p className="text-center">
                  {page > 1 && (
                    <Link to={{ pathname: '/support', search: new URLSearchParams({ ...(initialSiteId != null ? { id: String(initialSiteId) } : {}), page: String(page - 1) }).toString() }}>&laquo; 前のページ</Link>
                  )}
                  {page > 1 && hasNext && (
                    <span className="text-muted"> | </span>
                  )}
                  {hasNext && (
                    <Link to={{ pathname: '/support', search: new URLSearchParams({ ...(initialSiteId != null ? { id: String(initialSiteId) } : {}), page: String(page + 1) }).toString() }}>次のページ &raquo;</Link>
                  )}
                </p>
              )}
            </>
          ) : (
            <>
              {posts.map(post => (
                <article key={post.id} className="post-card">
                  <div className="post-header">
                    <span>投稿 ID [{post.id}]</span>
                    <span>{convertUtcToJst(post.created_at)}</span>
                    <span>{post.user_name || '名無し'} さん</span>
                    {post.site_id != null && (
                      <Link to={{ pathname: '/site', search: `?id=${post.site_id}` }}>サイト ID [{post.site_id}]</Link>
                    )}
                  </div>
                  <p className="pre-wrap">{post.content}</p>
                </article>
              ))}
              
              {(page > 1 || hasNext) && (
                <p className="text-center">
                  {page > 1 && (
                    <Link to={{ pathname: '/support', search: new URLSearchParams({ ...(initialSiteId != null ? { id: String(initialSiteId) } : {}), page: String(page - 1) }).toString() }}>&laquo; 前のページ</Link>
                  )}
                  {page > 1 && hasNext && (
                    <span className="text-muted"> | </span>
                  )}
                  {hasNext && (
                    <Link to={{ pathname: '/support', search: new URLSearchParams({ ...(initialSiteId != null ? { id: String(initialSiteId) } : {}), page: String(page + 1) }).toString() }}>次のページ &raquo;</Link>
                  )}
                </p>
              )}
            </>
          )}
          
          {initialSiteId != null && (
            <p className="text-right"><Link to={{ pathname: '/site', search: `?id=${initialSiteId}` }}>このサイトの詳細へ戻る</Link></p>
          )}
        </>
      )}
      
      <p className="text-right"><Link to="/">トップへ戻る</Link></p>
    </main>
  );
}
