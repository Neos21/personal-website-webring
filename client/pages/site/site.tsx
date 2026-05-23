import ky from 'ky';
import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { newSiteCommentSchema, userNameDisplayName, userNameMaxLength, commentDisplayName, commentMaxLength } from '../../../shared/schemas/comment-schema';
import { TurnstileField } from '../../components/turnstile-field';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SitePublicWithTags } from '../../../shared/types/site';
import type { SiteCommentPublic } from '../../../shared/types/site-comment';

export default function Site(): ReactElement {
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
  const [comments , setComments ] = useState<Array<SiteCommentPublic>>([]);
  const [hasNext  , setHasNext  ] = useState<boolean>(false);
  
  // コメント一覧 エラー表示系
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  // コメント入力フォーム
  const [commentUserName, setCommentUserName] = useState<string>('');
  const [commentContent , setCommentContent ] = useState<string>('');
  const [turnstileToken , setTurnstileToken ] = useState<string>('');
  const [turnstileKey   , setTurnstileKey   ] = useState<string>(String(Date.now()));
  
  // コメント入力フォーム エラー表示系
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError   , setFormError   ] = useState<string>('');
  
  useEffect(() => {
    if(siteId == null) {
      setError('サイト ID が指定されていません');
      return setIsLoading(false);
    }
    if(siteId === 0 || Number.isNaN(siteId)) {
      setError('サイト ID が不正です');
      return setIsLoading(false);
    }
    
    (async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const [siteResponse, commentsResponse] = await Promise.all([
          ky.get(`/api/sites/${siteId}`).json<{ result: SitePublicWithTags; }>(),
          ky.get(`/api/sites/${siteId}/comments?page=${page}`).json<{ result: { page: number; comments: Array<SiteCommentPublic>; has_next: boolean; }; }>()
        ]);
        
        setSite(siteResponse.result);
        setComments(commentsResponse.result.comments);
        setHasNext(commentsResponse.result.has_next);
        // TODO : URL を `?id=【ID】&page=【ページ番号】` に書き換える
      }
      catch(error) {
        setError(extractApiErrorMessage(error, '情報の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [siteId, page]);
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError('');
    
    const payload = {
      user_name      : commentUserName,
      content        : commentContent,
      turnstile_token: turnstileToken
    };
    const parsed = newSiteCommentSchema.safeParse(payload);
    if(!parsed.success) return setFormError(mergeIssues(parsed.error));
    
    setIsSubmitting(true);
    try {
      await ky.post(`/api/sites/${siteId}/comments`, { json: parsed.data }).json();
      
      setCommentContent('');
      setTurnstileToken('');
      setTurnstileKey(String(Date.now()));
      
      // 1ページ目に戻って再読込する
      const response = await ky.get(`/api/sites/${siteId}/comments?page=1`).json<{ result: { page: number; comments: Array<SiteCommentPublic>; has_next: boolean; }; }>();
      setComments(response.result.comments);
      setHasNext(response.result.has_next);
      // TODO : URL のパラメータが更新されていないので直す
    }
    catch(error) {
      setFormError(extractApiErrorMessage(error, 'コメントの投稿に失敗しました'));
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
      ) : !isEmpty(error) ? (
        <>
          <p className="text-error">{error}</p>
          <p className="text-right"><Link to="/list">登録済サイト一覧へ戻る</Link></p>
        </>
      ) : site == null ? (
        <>
          <p className="text-error">サイトが見つかりませんでした。</p>
          <p className="text-right"><Link to="/list">登録済サイト一覧へ戻る</Link></p>
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
            
            {comments.length === 0 ? (
              <p>まだコメントはありません。</p>
            ) : (
              <>
                {comments.map(comment => (
                  <article key={comment.id} className="comment-card">
                    <div className="comment-header">
                      <span>[{comment.id}]</span>
                      <span>{convertUtcToJst(comment.created_at)}</span>
                      <span>{comment.user_name || '名無し'}</span>
                    </div>
                    <p className="pre-wrap">{comment.content}</p>
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
                <input type="text" placeholder={userNameDisplayName} value={commentUserName} maxLength={userNameMaxLength} onChange={event => setCommentUserName(event.target.value)} />
              </label>
              
              <label>
                <div className="form-label">{commentDisplayName} <span className="form-label-memo">(必須・{commentMaxLength}文字以内)</span></div>
                <textarea placeholder={commentDisplayName} value={commentContent} maxLength={commentMaxLength} onChange={event => setCommentContent(event.target.value)} required rows={6} />
              </label>
              
              <TurnstileField key={turnstileKey} onTokenChange={setTurnstileToken} />
              
              {!isEmpty(formError) && (<p className="text-error">{formError}</p>)}
              
              <p><button type="submit" disabled={isSubmitting}>{isSubmitting ? '送信中…' : '投稿する'}</button></p>
            </fieldset>
          </form>
          
          <p className="text-right"><Link to="/list">登録済サイト一覧へ戻る</Link></p>
        </>
      )}
    </main>
  );
}
