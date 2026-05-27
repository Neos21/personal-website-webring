import ky from 'ky';
import { useCallback, useEffect, useRef, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { newPostSchema, contentDisplayName, contentMaxLength, userNameDisplayName, userNameMaxLength, siteIdDisplayName } from '../../../shared/schemas/post-schema';
import { TurnstileField } from '../../components/turnstile-field';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';
import { useUserStore } from '../../stores/user-store';

import type { PostPublic } from '../../../shared/types/post';
import type { SiteNameUrl } from '../../../shared/types/site';

export default function Support(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // サイト ID パラメータ (任意)
  const siteIdParam = searchParams.get('id');
  const siteId      = isEmpty(siteIdParam) ? null : Number(siteIdParam);  // `NaN` は初期表示処理内で判定する
  
  // ページング
  const pageParam  = searchParams.get('page');
  const pageNumber = isEmpty(pageParam) ? 1 : Number(pageParam);
  const page       = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  // 投稿一覧
  const [posts    , setPosts    ] = useState<Array<PostPublic>>([]);
  const [hasNext  , setHasNext  ] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  
  // 投稿フォーム
  const [formSiteId    , setFormSiteId    ] = useState<string>(siteId != null ? String(siteId) : '');
  const [userName      , setUserName      ] = useState<string>(useUserStore.getState().name || '');
  const [content       , setContent       ] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  
  // エラー表示系
  const [lookupSite  , setLookupSite  ] = useState<SiteNameUrl | null>(null);
  const [lookupError , setLookupError ] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error       , setError       ] = useState<string>('');
  
  const onBlurSiteId = useCallback(async (): Promise<void> => {
    if(isEmpty(formSiteId)) {
      setLookupError('');
      setLookupSite(null);
      return;
    }
    
    const inputSiteId = Number(formSiteId);
    if(!Number.isInteger(inputSiteId) || inputSiteId <= 0) {
      setLookupError('サイト ID は正の整数で指定してください');
      setLookupSite(null);
    }
    
    try {
      const response = await ky.get(`/api/sites/${inputSiteId}`).json<{ result: SiteNameUrl; }>();
      setLookupError('');
      setLookupSite(response.result);
    }
    catch(error) {
      setLookupError(extractApiErrorMessage(error, 'サイト情報の取得に失敗しました'));
      setLookupSite(null);
    }
  }, [formSiteId]);
  
  // 初期表示時に実行しようとするとおかしくなるのでその回避用
  const onBlurSiteIdRef = useRef(onBlurSiteId);
  useEffect(() => {
    onBlurSiteIdRef.current = onBlurSiteId;
  }, [onBlurSiteId]);
  
  useEffect(() => {
    (async () => {
      // 投稿後の再読込のためココで初期化する
      setIsLoading(true);
      setLoadError('');
      setPosts([]);
      setFormSiteId(siteId != null ? String(siteId) : '');
      setContent('');
      setTurnstileToken('');
      setLookupSite(null);
      setLookupError('');
      setIsSubmitting(false);
      setError('');
      
      if(siteId != null && (!Number.isInteger(siteId) || siteId <= 0)) {
        setLoadError('サイト ID が不正です');
        setIsLoading(false);
        return;
      }
      
      // URL に `page=1` がなければ再読込する
      const currentPageNumber = Number(pageParam);
      const needsPageFix = isEmpty(pageParam) || !Number.isInteger(currentPageNumber) || currentPageNumber <= 0;
      if(needsPageFix) {
        const query = new URLSearchParams();
        if(siteId != null) query.set('id', String(siteId));
        query.set('page', '1');
        navigate(`/support?${query.toString()}`, { replace: true });
        return;
      }
      
      if(siteId != null) onBlurSiteIdRef.current();  // サイト ID に基づく情報表示・裏で非同期実行する
      
      try {
        const query = new URLSearchParams();
        if(siteId != null) query.set('id', String(siteId));
        query.set('page', String(page));
        const response = await ky.get(`/api/posts?${query.toString()}`).json<{ result: { page: number; posts: Array<PostPublic>; has_next: boolean; }; }>();
        setPosts(response.result.posts);
        setHasNext(response.result.has_next);
      }
      catch(error) {
        setLoadError(extractApiErrorMessage(error, '投稿一覧の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [location.key, navigate, siteId, pageParam, page]);
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
    const submittedSiteId        = isEmpty(formSiteId) ? null : Number(formSiteId);
    const isValidSubmittedSiteId = isEmpty(formSiteId) || (submittedSiteId != null && Number.isInteger(submittedSiteId) && submittedSiteId > 0);
    
    const payload = {
      site_id        : isValidSubmittedSiteId ? submittedSiteId : null,
      user_name      : userName || null,
      content        : content,
      turnstile_token: turnstileToken
    };
    const parsed = newPostSchema.safeParse(payload);
    if(!parsed.success) return setError(mergeIssues(parsed.error));
    
    setIsSubmitting(true);
    try {
      await ky.post('/api/posts', { json: parsed.data }).json();
      
      useUserStore.getState().setName(parsed.data.user_name || '');
      setContent('');
      setLookupSite(null);
      setTurnstileToken('');
      
      // 投稿したサイト ID に基づいて1ページ目の URL に遷移する
      const query = new URLSearchParams();
      if(submittedSiteId != null) query.set('id', String(submittedSiteId));
      query.set('page', '1');
      navigate(`/support?${query.toString()}`);
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '投稿に失敗しました'));
      setIsSubmitting(false);
    }
  };
  
  return (
    <main>
      <title>サポート掲示板 - 個人サイトウェブリング</title>
      <h1>サポート掲示板</h1>
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : !isEmpty(loadError) ? (
        <>
          <div className="alert-danger mb-4 font-bold">{loadError}</div>
          <div className="mb-8"><Link to={{ pathname: '/support', search: '?page=1' }}>サポート掲示板の全体の投稿を見る場合はコチラ</Link></div>
        </>
      ) : (
        <>
          {siteId != null ? (
            <>
              <div className="mb-4"><Link to={{ pathname: '/site', search: `?id=${siteId}&page=1` }}>サイト ID [{siteId}]</Link> に関するサポート掲示板の投稿のみ絞り込み表示しています。</div>
              <div className="mb-8"><Link to={{ pathname: '/support', search: '?page=1' }}>サポート掲示板の全体の投稿を見る場合はコチラ</Link></div>
            </>
          ) : (
            <div className="mb-8">本ウェブリングに関するご意見・お問い合わせ・バグ報告などありましたらコチラにドウゾ。</div>
          )}
          
          <form className="mb-10" onSubmit={onSubmit}>
            <fieldset>
              <legend>投稿する</legend>
              
              <label>
                <div><span className="font-bold">{siteIdDisplayName}</span> <span className="form-label-memo">(特定サイトに関するお問合せの場合は入力してください)</span></div>
                <input type="text" placeholder={siteIdDisplayName} value={formSiteId} onChange={event => setFormSiteId(event.target.value)} onBlur={onBlurSiteId} />
              </label>
              
              {lookupSite != null && (
                <div className="alert-success">
                  <Link to={{ pathname: '/site', search: `?id=${lookupSite.id}&page=1` }}>{lookupSite.site_name}</Link>
                </div>
              )}
              {!isEmpty(lookupError) && (
                <div className="alert-danger font-bold">{lookupError}</div>
              )}
              
              <label>
                <div><span className="font-bold">{userNameDisplayName}</span> <span className="form-label-memo">(任意・{userNameMaxLength}文字以内)</span></div>
                <input type="text" placeholder={userNameDisplayName} value={userName} maxLength={userNameMaxLength} onChange={event => setUserName(event.target.value)} />
              </label>
              
              <label>
                <div><span className="font-bold">{contentDisplayName}</span> <span className="form-label-memo">(必須・{contentMaxLength}文字以内)</span></div>
                <textarea placeholder={contentDisplayName} value={content} maxLength={contentMaxLength} onChange={event => setContent(event.target.value)} required rows={4} />
              </label>
              
              <TurnstileField key={location.key} onTokenChange={setTurnstileToken} />
              
              {!isEmpty(error) && (<div className="alert-danger font-bold">{error}</div>)}
              
              <div><button type="submit" disabled={isSubmitting || !isEmpty(lookupError)}>{isSubmitting ? '送信中…' : '投稿する'}</button></div>
            </fieldset>
          </form>
          
          {posts.length === 0 ? (
            <>
              <div className="text-muted mb-8 text-sm">まだ投稿はありません。</div>
              {(page > 1 || hasNext) && (
                <div className="pager-links mb-8">
                  {page > 1            && (<Link to={{ pathname: '/support', search: new URLSearchParams({ ...(siteId != null ? { id: String(siteId) } : {}), page: String(page - 1) }).toString() }}>&laquo; 前のページ</Link>)}
                  {page > 1 && hasNext && (<span className="text-muted"> | </span>)}
                  {hasNext             && (<Link to={{ pathname: '/support', search: new URLSearchParams({ ...(siteId != null ? { id: String(siteId) } : {}), page: String(page + 1) }).toString() }}>次のページ &raquo;</Link>)}
                </div>
              )}
            </>
          ) : (
            <>
              {posts.map(post => (
                <section className="post-card" key={post.id}>
                  <div className="text-muted mb-1 text-sm">
                    <span>{convertUtcToJst(post.created_at)}</span>
                    {post.is_admin ? (
                      <>
                        <span className="ml-3 font-bold">{post.user_name || '名無し'}</span>
                        <span className="label-success ml-3 text-xs">リングマスター</span>
                      </>
                    ) : (
                      <span className="ml-3 font-bold">{post.user_name || '名無し'} さん</span>
                    )}
                    {post.site_id != null && (
                      <Link className="ml-3" to={{ pathname: '/site', search: `?id=${post.site_id}&page=1` }}>サイト ID [{post.site_id}]</Link>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap">{post.content}</div>
                </section>
              ))}
              
              {(page > 1 || hasNext) && (
                <div className="pager-links mt-6 mb-8">
                  {page > 1            && (<Link to={{ pathname: '/support', search: new URLSearchParams({ ...(siteId != null ? { id: String(siteId) } : {}), page: String(page - 1) }).toString() }}>&laquo; 前のページ</Link>)}
                  {page > 1 && hasNext && (<span className="text-muted"> | </span>)}
                  {hasNext             && (<Link to={{ pathname: '/support', search: new URLSearchParams({ ...(siteId != null ? { id: String(siteId) } : {}), page: String(page + 1) }).toString() }}>次のページ &raquo;</Link>)}
                </div>
              )}
            </>
          )}
          
          {siteId != null && (
            <div className="mb-8 text-sm text-right"><Link to={{ pathname: '/site', search: `?id=${siteId}&page=1` }}>このサイトの詳細へ戻る</Link></div>
          )}
        </>
      )}
      
      <div className="mt-8 text-right"><Link to="/">トップへ戻る</Link></div>
    </main>
  );
}
