import ky from 'ky';
import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { newSiteCommentSchema, userNameDisplayName, userNameMaxLength, commentDisplayName, commentMaxLength } from '../../../shared/schemas/site-comment-schema';
import { TurnstileField } from '../../components/turnstile-field';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SitePublicWithTags } from '../../../shared/types/site';
import type { SiteCommentPublic } from '../../../shared/types/site-comment';

export default function Site(): ReactElement {
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
  const [userName      , setUserName      ] = useState<string>('');
  const [content       , setContent       ] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  
  // コメント入力フォーム エラー表示系
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error       , setError       ] = useState<string>('');
  
  useEffect(() => {
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
      navigate(`/support?id=${siteId}&page=1`, { replace: true });
      return;
    }
    
    (async () => {
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
  }, [siteId, pageParam, page]);
  
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
      navigate(`/support?id=${siteId}&page=1`);
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'コメントの投稿に失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <main className="page-container">
      <h1>サイト詳細</h1>
      
      {isLoading ? (
        <p className="loading">読み込み中…</p>
      ) : !isEmpty(loadError) ? (
        <>
          <p className="text-error">{loadError}</p>
          <p className="text-right"><Link to={{ pathname: '/list', search: '?page=1' }}>登録済サイト一覧へ戻る</Link></p>
        </>
      ) : site == null ? (
        <>
          <p className="text-error">サイトが見つかりませんでした。</p>
          <p className="text-right"><Link to={{ pathname: '/list', search: '?page=1' }}>登録済サイト一覧へ戻る</Link></p>
        </>
      ) : (
        <>
          <article className="site-card">
            <h2><a href={site.url} target="_blank">{site.site_name}</a></h2>
            
            {!isEmpty(site.banner_url) && (
              <p>
                <a href={site.url} target="_blank">
                  <img
                    src={site.banner_url!}
                    width={site.banner_width ?? undefined}
                    height={site.banner_height ?? undefined}
                    alt={site.site_name}
                    title={site.site_name}
                  />
                </a>
              </p>
            )}
            
            <p className="pre-wrap">{site.description || '説明はありません'}</p>
            
            <ul>
              <li>管理人 : {site.owner_name || '-'}</li>
              <li>登録日 : {convertUtcToJst(site.created_at)}</li>
              <li>{site.is_self === 1 ? '自薦' : '他薦'}</li>
            </ul>
            
            <div className="tags">
              {site.tags.map(tag => (
                <span key={tag.id} className="tag">{tag.name}</span>
              ))}
            </div>
          </article>
          
          <p className="text-right"><Link to={{ pathname: '/edit', search: `?id=${siteId}` }}>{site.is_self === 1 ? '管理人様用 : 編集・削除' : 'このサイトの管理人ですか？'}</Link></p>
          <p className="text-right"><Link to={{ pathname: '/support', search: `?id=${siteId}` }}>このサイトについてサポート掲示板で問い合わせる</Link></p>
          
          <section>
            <h2>サイトへのコメント</h2>
            
            {siteComments.length === 0 ? (
              <p>まだコメントはありません。</p>
            ) : (
              <>
                {siteComments.map(siteComment => (
                  <article key={siteComment.id} className="site-comment-card">
                    <div className="site-comment-header">
                      <span>[{siteComment.id}]</span>
                      <span>{convertUtcToJst(siteComment.created_at)}</span>
                      <span>{siteComment.user_name || '名無し'}</span>
                    </div>
                    <p className="pre-wrap">{siteComment.content}</p>
                  </article>
                ))}
              </>
            )}
            
            {(page > 1 || hasNext) && (
              <p className="text-center">
                {page > 1 && (
                  <Link to={{ pathname: '/site', search: `?id=${siteId}&page=${page - 1}` }}>&laquo; 前のページ</Link>
                )}
                {page > 1 && hasNext && (
                  <span className="text-muted"> | </span>
                )}
                {hasNext && (
                  <Link to={{ pathname: '/site', search: `?id=${siteId}&page=${page + 1}` }}>次のページ &raquo;</Link>
                )}
              </p>
            )}
          </section>
          
          <form onSubmit={onSubmit}>
            <fieldset>
              <legend>コメントを投稿する</legend>
              
              <label>
                <div className="form-label">{userNameDisplayName} <span className="form-label-memo">(任意・{userNameMaxLength}文字以内)</span></div>
                <input type="text" placeholder={userNameDisplayName} value={userName} maxLength={userNameMaxLength} onChange={event => setUserName(event.target.value)} />
              </label>
              
              <label>
                <div className="form-label">{commentDisplayName} <span className="form-label-memo">(必須・{commentMaxLength}文字以内)</span></div>
                <textarea placeholder={commentDisplayName} value={content} maxLength={commentMaxLength} onChange={event => setContent(event.target.value)} required rows={6} />
              </label>
              
              <TurnstileField onTokenChange={setTurnstileToken} />
              
              {!isEmpty(error) && (<p className="text-error">{error}</p>)}
              
              <p><button type="submit" disabled={isSubmitting}>{isSubmitting ? '送信中…' : '投稿する'}</button></p>
            </fieldset>
          </form>
          
          <p className="text-right"><Link to={{ pathname: '/list', search: '?page=1' }}>登録済サイト一覧へ戻る</Link></p>
        </>
      )}
    </main>
  );
}
