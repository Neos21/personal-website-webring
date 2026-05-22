import ky from 'ky';
import { useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { isEmpty } from '../../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import {
  bannerUrlDisplayName,
  bannerUrlMaxLength,
  descriptionDisplayName,
  descriptionMaxLength,
  newSiteSchema,
  ownerNameDisplayName,
  ownerNameMaxLength,
  passwordDisplayName,
  passwordMaxLength,
  recommenderCommentDisplayName,
  recommenderCommentMaxLength,
  recommenderNameDisplayName,
  recommenderNameMaxLength,
  siteNameDisplayName,
  siteNameMaxLength,
  tagDisplayName,
  tagMaxLength,
  tagsMax,
  urlDisplayName,
  urlMaxLength
} from '../../../../shared/schemas/site-schema';
import { TurnstileField } from '../../../components/turnstile-field';
import { bannerSizeToDimensions, type BannerSize } from '../../../helpers/banner-size-to-dimensions';
import { extractApiErrorMessage } from '../../../helpers/extract-api-error-message';

export function NewSiteForm(): ReactElement {
  const navigate = useNavigate();
  
  const [isSelf            , setIsSelf            ] = useState<0 | 1>(0);
  const [siteName          , setSiteName          ] = useState<string>('');
  const [url               , setUrl               ] = useState<string>('');
  const [ownerName         , setOwnerName         ] = useState<string>('');
  const [description       , setDescription       ] = useState<string>('');
  const [tagsInput         , setTagsInput         ] = useState<string>('');
  const [bannerUrl         , setBannerUrl         ] = useState<string>('');
  const [bannerSize        , setBannerSize        ] = useState<BannerSize>('200x40');
  const [password          , setPassword          ] = useState<string>('');
  const [recommenderName   , setRecommenderName   ] = useState<string>('');
  const [recommenderComment, setRecommenderComment] = useState<string>('');
  const [turnstileToken    , setTurnstileToken    ] = useState<string>('');
  
  const [isDenyDomain, setIsDenyDomain] = useState<boolean>(false);
  const [exactMatchId, setExactMatchId] = useState<number | null>(null);
  const [nearMatchId , setNearMatchId ] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [clientError , setClientError ] = useState<string>('');
  const [serverError , setServerError ] = useState<string>('');
  
  const onChangeIsSelf = (value: 0 | 1): void => {
    setIsSelf(value);
    setClientError('');
    setServerError('');
    if(value === 0) setPassword('');
    if(value === 1) {
      setRecommenderName('');
      setRecommenderComment('');
    }
  };
  
  const checkDenyDomain = async (inputUrl: string): Promise<void> => {
    setIsDenyDomain(false);
    if(isEmpty(inputUrl)) return;
    try {
      const response = await ky.get('/api/deny-domains/search', { searchParams: { url: inputUrl } }).json<{ result: { is_denied: boolean; domain: string | null; } }>();
      if(response.result.is_denied) setIsDenyDomain(true);
    }
    catch { /* Do Nothing */ }
  };
  
  const checkUrlMatch = async (inputUrl: string): Promise<void> => {
    setExactMatchId(null);
    setNearMatchId(null);
    if(isEmpty(inputUrl)) return;
    try {
      const response = await ky.get('/api/sites/search-url', { searchParams: { url: inputUrl } }).json<{ result: { exact_match_id: number | null; near_match_id: number | null; } }>();
      if(response.result.exact_match_id != null) setExactMatchId(response.result.exact_match_id);
      else if(response.result.near_match_id != null) setNearMatchId(response.result.near_match_id);
    }
    catch { /* Do Nothing */ }
  };
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setClientError('');
    setServerError('');
    
    const { banner_height, banner_width } = bannerSizeToDimensions(bannerSize);
    const hasBannerUrl = !isEmpty(bannerUrl);
    
    const payload = {
      is_self            : isSelf,
      site_name          : siteName,
      url                : url,
      owner_name         : ownerName,
      description        : description,
      tags               : tagsInput,
      banner_url         : hasBannerUrl ? bannerUrl          : null,
      banner_height      : hasBannerUrl ? banner_height      : null,
      banner_width       : hasBannerUrl ? banner_width       : null,
      password           : isSelf === 1 ? password           : null,
      recommender_comment: isSelf === 0 ? recommenderComment : null,
      recommender_name   : isSelf === 0 ? recommenderName    : null,
      turnstile_token    : turnstileToken
    };
    const parsed = newSiteSchema.safeParse(payload);
    if(!parsed.success) return setClientError(mergeIssues(parsed.error));
    
    setIsSubmitting(true);
    try {
      const response = await ky.post('/api/sites', { json: parsed.data }).json<{ result: { id: number; }; }>();
      navigate(`/site?id=${response.result.id}`);
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '登録に失敗しました');
      setServerError(errorMessage);
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
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
          <input type="url" placeholder={urlDisplayName} value={url} maxLength={urlMaxLength} onChange={event => { setUrl(event.target.value); setIsDenyDomain(false); setExactMatchId(null); setNearMatchId(null); }} onBlur={() => { checkDenyDomain(url); checkUrlMatch(url); }} required />
          {isDenyDomain && (<p className="text-error">このドメインは登録できません</p>)}
          {exactMatchId != null && (<p className="text-error">この URL は登録済みです : <Link to={`/site?id=${exactMatchId}`}>ID [{exactMatchId}]</Link></p>)}
          {nearMatchId  != null && (<p className="text-warning">類似する URL が登録済みです : <Link to={`/site?id=${nearMatchId}`}>ID [{nearMatchId}]</Link></p>)}
        </label>
        
        <label>
          <div className="form-label">{ownerNameDisplayName} <span className="form-label-memo">(任意・{ownerNameMaxLength}文字以内)</span></div>
          <input type="text" placeholder={ownerNameDisplayName} value={ownerName} maxLength={ownerNameMaxLength} onChange={event => setOwnerName(event.target.value)} />
        </label>
        
        <label>
          <div className="form-label">{descriptionDisplayName} <span className="form-label-memo">(任意・{descriptionMaxLength}文字以内)</span></div>
          <textarea placeholder={descriptionDisplayName} value={description} maxLength={descriptionMaxLength} onChange={event => setDescription(event.target.value)} rows={5} />
        </label>
        
        <label>
          <div className="form-label">{tagDisplayName} <span className="form-label-memo">(必須・1〜{tagsMax}個・区切りはカンマまたは空白・1つ{tagMaxLength}文字以内)</span></div>
          <input type="text" placeholder={tagDisplayName} value={tagsInput} onChange={event => setTagsInput(event.target.value)} required />
        </label>
        
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
            <input type="radio" name="banner_size" value="88x31" checked={bannerSize === '88x31'} onChange={() => setBannerSize('88x31')} /> 88x31
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
            <textarea placeholder={recommenderCommentDisplayName} value={recommenderComment} maxLength={recommenderCommentMaxLength} onChange={event => setRecommenderComment(event.target.value)} required rows={5} />
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
      
      {!isEmpty(clientError) && <p className="text-error">{clientError}</p>}
      {!isEmpty(serverError) && <p className="text-error">{serverError}</p>}
      
      <p><button type="submit" disabled={isSubmitting || isDenyDomain || exactMatchId != null}>{isSubmitting ? '送信中…' : '登録する'}</button></p>
      
      <p className="text-right"><Link to="/">トップへ戻る</Link></p>
    </form>
  );
}
