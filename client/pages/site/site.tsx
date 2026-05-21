import ky from 'ky';
import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { siteCommentSchema, userNameDisplayName, userNameMaxLength, commentDisplayName, commentMaxLength } from '../../../shared/schemas/comment-schema';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SitePublic } from '../../../shared/types/site';
import type { SiteCommentPublic } from '../../../shared/types/site-comment';

export default function Site(): ReactElement {
  const [searchParams] = useSearchParams();
  
  const idParam = searchParams.get('id');
  const siteId = isEmpty(idParam) ? null : Number(idParam);
  
  const [site     , setSite     ] = useState<SitePublic | null>(null);
  const [comments , setComments ] = useState<Array<SiteCommentPublic>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  const [commentUserName, setCommentUserName   ] = useState<string>('');
  const [commentContent , setCommentContent    ] = useState<string>('');
  const [isSubmitting   , setIsSubmitting      ] = useState<boolean>(false);
  const [postClientError, setCommentClientError] = useState<string>('');
  const [postServerError, setCommentServerError] = useState<string>('');
  
  useEffect(() => {
    if(siteId == null) {
      setError('サイト ID が指定されていません');
      setIsLoading(false);
      return;
    }
    
    (async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const [siteResponse, commentsResponse] = await Promise.all([
          ky.get(`/api/sites/${siteId}`).json<{ result: SitePublic; }>(),
          ky.get(`/api/sites/${siteId}/comments`).json<{ result: Array<SiteCommentPublic>; }>()
        ]);
        
        setSite(siteResponse.result);
        setComments(commentsResponse.result);
      }
      catch(err) {
        const errorMessage = await extractApiErrorMessage(err, '情報の取得に失敗しました');
        setError(errorMessage);
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [siteId]);
  
  const onSubmitComment = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setCommentClientError('');
    setCommentServerError('');
    if(siteId == null) return;
    
    const payload = {
      user_name: commentUserName,
      content  : commentContent
    };
    const parsedResult = siteCommentSchema.safeParse(payload);
    if(!parsedResult.success) return setCommentClientError(mergeIssues(parsedResult.error));
    
    setIsSubmitting(true);
    try {
      await ky.post(`/api/sites/${siteId}/comments`, { json: parsedResult.data }).json();
      
      setCommentUserName('');
      setCommentContent('');
      
      const commentsResponse = await ky.get(`/api/sites/${siteId}/comments`).json<{ result: Array<SiteCommentPublic>; }>();
      setComments(commentsResponse.result);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, 'コメントの投稿に失敗しました');
      setCommentServerError(errorMessage);
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <main className="site-page page-container">
      <h1>サイト詳細</h1>
      
      {isLoading ? (
        <p>読み込み中…</p>
      ) : !isEmpty(error) ? (
        <p className="text-error">{error}</p>
      ) : site == null ? (
        <p>サイトが見つかりませんでした。</p>
      ) : (
        <>
          <section className="site-detail" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginBottom: '2rem' }}>
            <h2 style={{ marginTop: 0 }}><a href={site.url} target="_blank">{site.site_name}</a></h2>
            
            {!isEmpty(site.banner_url) && (
              <div className="site-banner" style={{ marginBottom: '1rem' }}>
                <a href={site.url} target="_blank">
                  <img
                    src={site.banner_url!}
                    width={site.banner_width ?? undefined}
                    height={site.banner_height ?? undefined}
                    alt={site.site_name}
                    title={site.site_name}
                    style={{ maxWidth: '100%', height: 'auto', border: '1px solid #eee' }}
                  />
                </a>
              </div>
            )}
            
            <p className="description pre-wrap">{site.description || '説明がありません'}</p>
            
            <ul className="site-meta" style={{ listStyle: 'none', padding: 0, color: '#666', fontSize: '0.9rem' }}>
              <li>管理人: {site.owner_name || '-'}</li>
              <li>登録日: {convertUtcToJst(site.created_at)}</li>
              <li>種別: {site.is_self === 1 ? '自薦' : '他薦'}</li>
            </ul>
          </section>
          
          <p>
            <Link to={`/support?id=${siteId}`}>このサイトについてサポート掲示板で問い合わせる</Link>
          </p>
          
          <hr style={{ margin: '2rem 0' }} />
          
          <section className="comments-section">
            <h3>コメント</h3>
            
            {comments.length === 0 ? (
              <p>まだコメントはありません。</p>
            ) : (
              <div className="comments-list">
                {comments.map(comment => (
                  <article key={comment.id} className="comment" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div className="comment-meta" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                      <span className="comment-author" style={{ fontWeight: 'bold' }}>{comment.user_name || '名無し'}</span>
                      <span className="comment-date" style={{ marginLeft: '1rem' }}>{convertUtcToJst(comment.created_at)}</span>
                    </div>
                    <div className="comment-content pre-wrap">{comment.content}</div>
                  </article>
                ))}
              </div>
            )}
            
            <form onSubmit={onSubmitComment} style={{ marginTop: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
              <h4>コメントを投稿する</h4>
              
              <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                <label>
                  <div className="form-label">{userNameDisplayName} <span className="form-label-memo">(任意・{userNameMaxLength}文字以内)</span></div>
                  <input type="text" placeholder={userNameDisplayName} value={commentUserName} maxLength={userNameMaxLength} onChange={event => setCommentUserName(event.target.value)} />
                </label>
                
                <label>
                  <div className="form-label">{commentDisplayName} <span className="form-label-memo">(必須・{commentMaxLength}文字以内)</span></div>
                  <textarea placeholder={commentDisplayName} value={commentContent} maxLength={commentMaxLength} onChange={event => setCommentContent(event.target.value)} required rows={4} />
                </label>
              </fieldset>
              
              {!isEmpty(postClientError) && <p className="text-error">{postClientError}</p>}
              {!isEmpty(postServerError) && <p className="text-error">{postServerError}</p>}
              
              <p>
                <button type="submit" disabled={isSubmitting}>{isSubmitting ? '送信中…' : '投稿する'}</button>
              </p>
            </form>
          </section>
          
          <p className="text-right" style={{ marginTop: '2rem' }}>
            <Link to="/list">一覧へ戻る</Link>
          </p>
        </>
      )}
    </main>
  );
}
