import ky from 'ky';
import { useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { bannerUrlDisplayName, bannerUrlMaxLength, descriptionDisplayName, descriptionMaxLength, newSiteSchema, ownerNameDisplayName, ownerNameMaxLength, passwordDisplayName, passwordMaxLength, recommenderCommentDisplayName, recommenderCommentMaxLength, recommenderNameDisplayName, recommenderNameMaxLength, siteNameDisplayName, siteNameMaxLength, tagDisplayName, tagMaxLength, tagsMax, urlDisplayName, urlMaxLength } from '../../../shared/schemas/site-schema';
import { TurnstileField } from '../../components/turnstile-field';
import { convertBannerSizeToDimensions, type BannerSize } from '../../helpers/convert-banner-size-to-dimensions';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SiteNameUrl } from '../../../shared/types/site';

export default function New(): ReactElement {
  const navigate = useNavigate();
  
  // 入力フォーム
  const [isSelf            , setIsSelf            ] = useState<0 | 1>(0);
  const [siteName          , setSiteName          ] = useState<string>('');
  const [url               , setUrl               ] = useState<string>('');
  const [ownerName         , setOwnerName         ] = useState<string>('');
  const [description       , setDescription       ] = useState<string>('');
  const [tags              , setTags              ] = useState<Array<string>>([]);
  const [tagInput          , setTagInput          ] = useState<string>('');
  const [bannerUrl         , setBannerUrl         ] = useState<string>('');
  const [bannerSize        , setBannerSize        ] = useState<BannerSize>('200x40');
  const [password          , setPassword          ] = useState<string>('');
  const [recommenderName   , setRecommenderName   ] = useState<string>('');
  const [recommenderComment, setRecommenderComment] = useState<string>('');
  const [turnstileToken    , setTurnstileToken    ] = useState<string>('');
  
  // エラー表示系
  const [isDenyDomain, setIsDenyDomain] = useState<boolean>(false);
  const [exactMatch  , setExactMatch  ] = useState<SiteNameUrl | null>(null);
  const [nearMatch   , setNearMatch   ] = useState<SiteNameUrl | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error       , setError       ] = useState<string>('');
  
  const onChangeIsSelf = (inputIsSelf: 0 | 1): void => {
    setIsSelf(inputIsSelf);
    setError('');
    if(inputIsSelf === 0) {
      setPassword('');
    }
    else if(inputIsSelf === 1) {
      setRecommenderName('');
      setRecommenderComment('');
    }
  };
  
  const onBlurUrl = async (inputUrl: string): Promise<void> => {
    if(isEmpty(inputUrl)) {
      setIsDenyDomain(false);
      setExactMatch(null);
      setNearMatch(null);
      return;
    }
    
    // `new URL()` で解釈できない文字列はチェックしない
    try {
      new URL(inputUrl);
    }
    catch {
      setIsDenyDomain(false);
      setExactMatch(null);
      setNearMatch(null);
      return;
    }
    
    // 禁止ドメインのチェック
    try {
      const response = await ky.get('/api/deny-domains/search', { searchParams: { url: inputUrl } }).json<{ result: { is_denied: boolean; }; }>();
      if(response.result.is_denied) {
        setIsDenyDomain(true);
        setExactMatch(null);
        setNearMatch(null);
        return;  // 重複・類似 URL チェックは行わない
      }
    }
    catch { /* Do Nothing */ }
    setIsDenyDomain(false);
    
    // 重複・類似 URL のチェック
    try {
      const response = await ky.get('/api/sites/search-url', { searchParams: { url: inputUrl } }).json<{ result: { exact_match: SiteNameUrl | null; near_match: SiteNameUrl | null; }; }>();
      setExactMatch(response.result.exact_match);
      setNearMatch(response.result.near_match);
    }
    catch {
      setExactMatch(null);
      setNearMatch(null);
    }
  };
  
  const onAddTag = (tagInput: string): void => {
    const tag = tagInput.trim();
    // 空欄・上限文字数超過・最大タグ数超過は無視する
    if(isEmpty(tag) || tags.length >= tagsMax || tag.length > tagMaxLength) return;
    // 重複するタグは追加できないようにする
    if(tags.map(tag => tag.toLowerCase()).includes(tag.toLowerCase())) return;
    setTags(prevTags => [...prevTags, tag]);
    setTagInput('');
  };
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    
    const hasBannerUrl = !isEmpty(bannerUrl);
    const { bannerWidth, bannerHeight } = convertBannerSizeToDimensions(bannerSize);
    
    const payload = {
      is_self            : isSelf,
      site_name          : siteName,
      url                : url,
      owner_name         : ownerName,
      description        : description,
      tags               : tags,
      banner_url         : hasBannerUrl ? bannerUrl          : null,
      banner_width       : hasBannerUrl ? bannerWidth        : null,
      banner_height      : hasBannerUrl ? bannerHeight       : null,
      password           : isSelf === 1 ? password           : null,
      recommender_comment: isSelf === 0 ? recommenderComment : null,
      recommender_name   : isSelf === 0 ? recommenderName    : null,
      turnstile_token    : turnstileToken
    };
    const parsed = newSiteSchema.safeParse(payload);
    if(!parsed.success) return setError(mergeIssues(parsed.error));
    
    setIsSubmitting(true);
    try {
      const response = await ky.post('/api/sites', { json: parsed.data }).json<{ result: { id: number; }; }>();
      navigate(`/site?id=${response.result.id}`);
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'サイトの登録に失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <main className="page-container">
      <h1>サイト新規登録</h1>
      <p>個人サイトをウェブリングに登録します。他薦・自薦を選んでフォームに入力してください。</p>
      
      <form onSubmit={onSubmit}>
        <fieldset>
          <legend>登録種別</legend>
          
          <div className="form-radio-2columns">
            <label>
              <input type="radio" name="is_self" value="0" checked={isSelf === 0} onChange={() => onChangeIsSelf(0)} /> 他薦
            </label>
            <label>
              <input type="radio" name="is_self" value="1" checked={isSelf === 1} onChange={() => onChangeIsSelf(1)} /> 自薦
            </label>
          </div>
        </fieldset>
        
        <fieldset>
          <legend>サイト情報</legend>
          
          <label>
            <div className="form-label">{siteNameDisplayName} <span className="form-label-memo">(必須・{siteNameMaxLength}文字以内)</span></div>
            <input type="text" placeholder={siteNameDisplayName} value={siteName} maxLength={siteNameMaxLength} onChange={event => setSiteName(event.target.value)} required />
          </label>
          
          <label>
            <div className="form-label">{urlDisplayName} <span className="form-label-memo">(必須・{urlMaxLength}文字以内)</span></div>
            <input type="url" placeholder={urlDisplayName} value={url} maxLength={urlMaxLength}
              onChange={event => { setUrl(event.target.value); setIsDenyDomain(false); setExactMatch(null); setNearMatch(null); }}
              onBlur={() => onBlurUrl(url)}
              required
            />
          </label>
          {isDenyDomain && (<p className="text-error">このドメインは登録できません</p>)}
          {exactMatch != null && (
            <div className="alert-error">
              <div className="text-error">この URL は登録済みです</div>
              <div>ID <Link to={{ pathname: '/show', search: `?id=${exactMatch.id}` }}>[{exactMatch.id}]</Link> {exactMatch.site_name}</div>
              <div><a href={exactMatch.url} target="_blank">{exactMatch.url}</a></div>
            </div>
          )}
          {nearMatch != null && (
            <div className="alert-warning">
              <div className="text-warning">類似する URL が登録されています</div>
              <div>ID <Link to={{ pathname: '/show', search: `?id=${nearMatch.id}` }}>[{nearMatch.id}]</Link> {nearMatch.site_name}</div>
              <div><a href={nearMatch.url} target="_blank">{nearMatch.url}</a></div>
            </div>
          )}
          
          <label>
            <div className="form-label">{ownerNameDisplayName} <span className="form-label-memo">(任意・{ownerNameMaxLength}文字以内)</span></div>
            <input type="text" placeholder={ownerNameDisplayName} value={ownerName} maxLength={ownerNameMaxLength} onChange={event => setOwnerName(event.target.value)} />
          </label>
          
          <label>
            <div className="form-label">{descriptionDisplayName} <span className="form-label-memo">(任意・{descriptionMaxLength}文字以内)</span></div>
            <textarea placeholder={descriptionDisplayName} value={description} maxLength={descriptionMaxLength} onChange={event => setDescription(event.target.value)} rows={6} />
          </label>
          
          <label>
            <div className="form-label">{tagDisplayName} <span className="form-label-memo">(必須・1〜{tagsMax}個・1つ{tagMaxLength}文字以内)</span></div>
            <div className="tag-input">
              <input type="text" placeholder={tagDisplayName} value={tagInput} maxLength={tagMaxLength} onChange={event => setTagInput(event.target.value)}
                onKeyDown={event => {
                  if(event.key !== 'Enter') return;
                  event.preventDefault();
                  onAddTag(tagInput);
                }}
                disabled={tags.length >= tagsMax}
              />
              <button type="button" onClick={() => onAddTag(tagInput)} disabled={tags.length >= tagsMax}>追加</button>
            </div>
          </label>
          {tags.length > 0 && (
            <div className="tags">
              {tags.map((tag, index) => (
                <button type="button" key={`${tag}-${index}`} onClick={() => setTags(prevTags => prevTags.filter((_, i) => i !== index))}>{tag} ×</button>
              ))}
            </div>
          )}
          
          <label>
            <div className="form-label">{bannerUrlDisplayName} <span className="form-label-memo">(任意・{bannerUrlMaxLength}文字以内)</span></div>
            <input type="url" placeholder={bannerUrlDisplayName} value={bannerUrl} maxLength={bannerUrlMaxLength} onChange={event => setBannerUrl(event.target.value)} />
          </label>
          
          <div className="form-label">バナーサイズ <span className="form-label-memo">{isEmpty(bannerUrl) ? '(バナー URL 指定時に必須)' : '(必須)'}</span></div>
          <div className="form-radio-2columns">
            <label>
              <input type="radio" name="banner_size" value="200x40" checked={bannerSize === '200x40'} onChange={() => setBannerSize('200x40')} /> 200x40
            </label>
            <label>
              <input type="radio" name="banner_size" value="88x31"  checked={bannerSize === '88x31' } onChange={() => setBannerSize('88x31') } /> 88x31
            </label>
          </div>
        </fieldset>
        
        {isSelf === 0 && (
          <fieldset>
            <legend>{recommenderCommentDisplayName}</legend>
            
            <label>
              <div className="form-label">{recommenderNameDisplayName} <span className="form-label-memo">(任意・{recommenderNameMaxLength}文字以内)</span></div>
              <input type="text" placeholder={recommenderNameDisplayName} value={recommenderName} maxLength={recommenderNameMaxLength} onChange={event => setRecommenderName(event.target.value)} />
            </label>
            
            <label>
              <div className="form-label">{recommenderCommentDisplayName} <span className="form-label-memo">(必須・{recommenderCommentMaxLength}文字以内)</span></div>
              <textarea placeholder={recommenderCommentDisplayName} value={recommenderComment} maxLength={recommenderCommentMaxLength} onChange={event => setRecommenderComment(event.target.value)} required rows={6} />
            </label>
          </fieldset>
        )}
        
        {isSelf === 1 && (
          <fieldset>
            <legend>{passwordDisplayName}</legend>
            
            <label>
              <div className="form-label">{passwordDisplayName} <span className="form-label-memo">(必須・{passwordMaxLength}文字以内)</span></div>
              <input type="password" placeholder={passwordDisplayName} value={password} maxLength={passwordMaxLength} onChange={event => setPassword(event.target.value)} required />
            </label>
          </fieldset>
        )}
        
        <TurnstileField onTokenChange={setTurnstileToken} />
        
        {!isEmpty(error) && (<p className="text-error">{error}</p>)}
        
        <p><button type="submit" disabled={isSubmitting || isDenyDomain || exactMatch != null}>{isSubmitting ? '送信中…' : '登録する'}</button></p>
      </form>
      
      <p className="text-right"><Link to="/">トップへ戻る</Link></p>
    </main>
  );
}
