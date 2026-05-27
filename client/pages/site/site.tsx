import ky from 'ky';
import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { newSiteCommentSchema, userNameDisplayName, userNameMaxLength, commentDisplayName, commentMaxLength } from '../../../shared/schemas/site-comment-schema';
import { TurnstileField } from '../../components/turnstile-field';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';
import { useUserStore } from '../../stores/user-store';

import type { SitePublicWithTags } from '../../../shared/types/site';
import type { SiteCommentPublic } from '../../../shared/types/site-comment';

export default function Site(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // サイト ID パラメータ (必須)
  const siteIdParam = searchParams.get('id');
  const siteId      = isEmpty(siteIdParam) ? null : Number(siteIdParam);
  
  // コメントのページング
  const pageParam  = searchParams.get('page');
  const pageNumber = isEmpty(pageParam) ? 1 : Number(pageParam);
  const page       = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  // サイト詳細
  const [site, setSite] = useState<SitePublicWithTags | null>(null);
  
  // コメント一覧
  const [siteComments, setSiteComments] = useState<Array<SiteCommentPublic>>([]);
  const [hasNext     , setHasNext     ] = useState<boolean>(false);
  
  // コメント一覧 エラー表示系
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  
  // コメント入力フォーム
  const [userName      , setUserName      ] = useState<string>(useUserStore.getState().name || '');
  const [content       , setContent       ] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  
  // コメント入力フォーム エラー表示系
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error       , setError       ] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      // 投稿後の再読込のためココで初期化する
      setIsLoading(true);
      setLoadError('');
      setSiteComments([]);
      setContent('');
      setTurnstileToken('');
      setIsSubmitting(false);
      setError('');
      
      if(siteId == null) {
        setLoadError('サイト ID が指定されていません');
        setIsLoading(false);
        return;
      }
      if(!Number.isInteger(siteId) || siteId <= 0) {
        setLoadError('サイト ID が不正です');
        setIsLoading(false);
        return;
      }
      
      // URL に `page=1` がなければ再読込する
      const currentPageNumber = Number(pageParam);
      const needsPageFix = isEmpty(pageParam) || !Number.isInteger(currentPageNumber) || currentPageNumber <= 0;
      if(needsPageFix) {
        navigate(`/site?id=${siteId}&page=1`, { replace: true });
        return;
      }
      
      try {
        const [siteResponse, siteCommentsResponse] = await Promise.all([
          ky.get(`/api/sites/${siteId}`).json<{ result: SitePublicWithTags; }>(),
          ky.get(`/api/sites/${siteId}/comments?page=${page}`).json<{ result: { page: number; comments: Array<SiteCommentPublic>; has_next: boolean; }; }>()
        ]);
        setSite(siteResponse.result);
        setSiteComments(siteCommentsResponse.result.comments);
        setHasNext(siteCommentsResponse.result.has_next);
      }
      catch(error) {
        setLoadError(extractApiErrorMessage(error, 'サイトの取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [location.key, navigate, siteId, pageParam, page]);  // `onSubmit` 時の `navigate()` でパラメータが変わらない場合も再読込させるため `location.key` を依存関係に入れる
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
    const payload = {
      user_name      : userName,
      content        : content,
      turnstile_token: turnstileToken
    };
    const parsed = newSiteCommentSchema.safeParse(payload);
    if(!parsed.success) return setError(mergeIssues(parsed.error));
    
    setIsSubmitting(true);
    try {
      await ky.post(`/api/sites/${siteId}/comments`, { json: parsed.data }).json();
      
      useUserStore.getState().setName(parsed.data.user_name || '');
      
      navigate(`/site?id=${siteId}&page=1`);
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'コメントの投稿に失敗しました'));
      setIsSubmitting(false);
    }
  };
  
  return (
    <main>
      <title>サイト詳細 - 個人サイトウェブリング</title>
      <h1>サイト詳細</h1>
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : !isEmpty(loadError) ? (
        <div className="alert-danger mb-8 font-bold">{loadError}</div>
      ) : site == null ? (
        <div className="alert-danger mb-8 font-bold">対象のサイトが見つかりませんでした</div>
      ) : (
        <>
          <section className="site-card mb-8 pb-1">
            <h2 className="mb-4 font-bold text-lg"><a href={site.url} target="_blank">{site.site_name}</a></h2>
            
            {!isEmpty(site.banner_url) && (
              <div className="mb-4 overflow-hidden" style={{ width: `${site.banner_width!}px`, height: `${site.banner_height!}px` }}>
                <a href={site.url} target="_blank"><img src={site.banner_url!} width={site.banner_width!} height={site.banner_height!} alt={site.site_name} title={site.site_name} /></a>
              </div>
            )}
            
            <div className="mb-4 text-sm whitespace-pre-wrap">{site.description || '説明はありません'}</div>
            
            <ul className="text-muted mb-4 text-xs">
              <li>
                ID : [{site.id}]
                {site.is_self === 1 ? (<span className="label-success ml-2">自薦</span>) : (<span className="label-info ml-2">他薦</span>)}
              </li>
              <li>管理人 : {site.owner_name || '-'}</li>
              <li>更新日 : {convertUtcToJst(site.updated_at, true)}</li>
            </ul>
            
            <div>
              {site.tags.map(tag => (
                <span className="tag" key={tag.id}>{tag.name}</span>
              ))}
            </div>
          </section>
          
          <div className="text-sm text-right"><Link to={{ pathname: '/edit', search: `?id=${siteId}` }}>{site.is_self === 1 ? '管理人様用 : 編集・削除' : 'このサイトの管理人様ですか？'}</Link></div>
          <div className="mb-8 text-sm text-right"><Link to={{ pathname: '/support', search: `?id=${siteId}&page=1` }}>このサイトについてサポート掲示板で問い合わせる</Link></div>
          
          <section className="mb-10">
            <h2 className="mb-5 font-bold text-lg">サイトへのコメント</h2>
            
            {siteComments.length === 0 ? (
              <div className="text-muted mb-4 text-sm">まだコメントはありません。</div>
            ) : (
              <>
                {siteComments.map(siteComment => (
                  <section className="site-comment-card" key={siteComment.id}>
                    <div className="text-muted mb-1 text-sm">
                      <span>{convertUtcToJst(siteComment.created_at)}</span>
                      <span className="ml-3">{siteComment.user_name || '名無し'} さん</span>
                    </div>
                    <div className="whitespace-pre-wrap">{siteComment.content}</div>
                  </section>
                ))}
              </>
            )}
            
            {(page > 1 || hasNext) && (
              <div className="pager-links mt-5">
                {page > 1            && (<Link to={{ pathname: '/site', search: `?id=${siteId}&page=${page - 1}` }}>&laquo; 前のページ</Link>)}
                {page > 1 && hasNext && (<span className="text-muted"> | </span>)}
                {hasNext             && (<Link to={{ pathname: '/site', search: `?id=${siteId}&page=${page + 1}` }}>次のページ &raquo;</Link>)}
              </div>
            )}
          </section>
          
          <form className="mb-10" onSubmit={onSubmit}>
            <fieldset>
              <legend>コメントを投稿する</legend>
              
              <label>
                <div><span className="font-bold">{userNameDisplayName}</span> <span className="form-label-memo">(任意・{userNameMaxLength}文字以内)</span></div>
                <input type="text" placeholder={userNameDisplayName} value={userName} maxLength={userNameMaxLength} onChange={event => setUserName(event.target.value)} />
              </label>
              
              <label>
                <div><span className="font-bold">{commentDisplayName}</span> <span className="form-label-memo">(必須・{commentMaxLength}文字以内)</span></div>
                <textarea placeholder={commentDisplayName} value={content} maxLength={commentMaxLength} onChange={event => setContent(event.target.value)} required rows={4} />
              </label>
              
              {/* 投稿後の再読込でリセットするため `key` に `location.key` を指定する */}
              <TurnstileField key={location.key} onTokenChange={setTurnstileToken} />
              
              {!isEmpty(error) && (<div className="alert-danger font-bold">{error}</div>)}
              
              <div><button type="submit" disabled={isSubmitting}>{isSubmitting ? '送信中…' : '投稿する'}</button></div>
            </fieldset>
          </form>
        </>
      )}
      
      <div className="mb-2 text-right"><Link to={{ pathname: '/list', search: '?page=1' }}>登録サイト一覧へ戻る</Link></div>
      <div className="text-right"><Link to="/">トップへ戻る</Link></div>
    </main>
  );
}
