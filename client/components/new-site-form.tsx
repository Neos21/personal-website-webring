import ky from 'ky';
import { useCallback, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { TurnstileField } from './turnstile-field';
import { isEmpty } from '../../shared/helpers/is-empty';
import { mergeIssues } from '../../shared/helpers/merge-issues';
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
} from '../../shared/schemas/site-schema';
import { extractApiErrorMessage } from '../helpers/extract-api-error-message';

type BannerSize = '200x40' | '88x31';

type CreateSiteResult = {
  result: {
    id: number;
    tags: Array<string>;
    warning: string | null;
  };
};

const bannerSizeToDimensions = (bannerSize: BannerSize): { banner_height: number; banner_width: number; } => {
  if(bannerSize === '88x31') return { banner_height: 31, banner_width: 88 };
  return { banner_height: 40, banner_width: 200 };
};

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
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [clientError , setClientError ] = useState<string>('');
  const [serverError , setServerError ] = useState<string>('');
  
  const handleIsSelfChange = useCallback((value: 0 | 1) => {
    setIsSelf(value);
    setClientError('');
    setServerError('');
    if(value === 0) setPassword('');
    if(value === 1) {
      setRecommenderName('');
      setRecommenderComment('');
    }
  }, []);
  
  const onSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setClientError('');
    setServerError('');
    
    const { banner_height, banner_width } = bannerSizeToDimensions(bannerSize);
    const hasBannerUrl = !isEmpty(bannerUrl);
    
    const payload = {
      banner_height      : hasBannerUrl ? banner_height : null,
      banner_url         : hasBannerUrl ? bannerUrl : null,
      banner_width       : hasBannerUrl ? banner_width : null,
      description        : description,
      is_self            : isSelf,
      owner_name         : ownerName,
      password           : isSelf === 1 ? password : null,
      recommender_comment: isSelf === 0 ? recommenderComment : null,
      recommender_name   : isSelf === 0 ? recommenderName : null,
      site_name          : siteName,
      tags               : tagsInput,
      turnstile_token    : turnstileToken,
      url                : url
    };
    
    const parsedResult = newSiteSchema.safeParse(payload);
    if(!parsedResult.success) return setClientError(mergeIssues(parsedResult.error));
    
    setIsSubmitting(true);
    try {
      const response = await ky.post('/api/sites', { json: parsedResult.data }).json<CreateSiteResult>();
      navigate(`/site?id=${response.result.id}`, { state: { warning: response.result.warning } });
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
    <form className="new-site-form" onSubmit={onSubmit}>
      <fieldset className="form-fieldset">
        <legend>登録種別</legend>
        <label className="form-radio">
          <input checked={isSelf === 0} name="is_self" onChange={() => handleIsSelfChange(0)} type="radio" value="0" />
          <span>他薦</span>
        </label>
        <label className="form-radio">
          <input checked={isSelf === 1} name="is_self" onChange={() => handleIsSelfChange(1)} type="radio" value="1" />
          <span>自薦</span>
        </label>
      </fieldset>
      
      <div className="form-field">
        <label htmlFor="new-site-form-site-name">{siteNameDisplayName} <span className="text-muted">(必須・{siteNameMaxLength}文字以内)</span></label>
        <input id="new-site-form-site-name" maxLength={siteNameMaxLength} onChange={event => setSiteName(event.target.value)} required type="text" value={siteName} />
      </div>
      
      <div className="form-field">
        <label htmlFor="new-site-form-url">{urlDisplayName} <span className="text-muted">(必須・{urlMaxLength}文字以内)</span></label>
        <input id="new-site-form-url" maxLength={urlMaxLength} onChange={event => setUrl(event.target.value)} required type="url" value={url} />
      </div>
      
      <div className="form-field">
        <label htmlFor="new-site-form-owner-name">{ownerNameDisplayName} <span className="text-muted">(任意・{ownerNameMaxLength}文字以内)</span></label>
        <input id="new-site-form-owner-name" maxLength={ownerNameMaxLength} onChange={event => setOwnerName(event.target.value)} type="text" value={ownerName} />
      </div>
      
      <div className="form-field">
        <label htmlFor="new-site-form-description">{descriptionDisplayName} <span className="text-muted">(任意・{descriptionMaxLength}文字以内)</span></label>
        <textarea id="new-site-form-description" maxLength={descriptionMaxLength} onChange={event => setDescription(event.target.value)} rows={5} value={description} />
      </div>
      
      <div className="form-field">
        <label htmlFor="new-site-form-tags">{tagDisplayName} <span className="text-muted">(必須・1〜{tagsMax}個・区切りはカンマまたは空白・1つ{tagMaxLength}文字以内)</span></label>
        <input id="new-site-form-tags" onChange={event => setTagsInput(event.target.value)} required type="text" value={tagsInput} />
      </div>
      
      <div className="form-field">
        <label htmlFor="new-site-form-banner-url">{bannerUrlDisplayName} <span className="text-muted">(任意・{bannerUrlMaxLength}文字以内)</span></label>
        <input id="new-site-form-banner-url" maxLength={bannerUrlMaxLength} onChange={event => setBannerUrl(event.target.value)} type="url" value={bannerUrl} />
      </div>
      
      <fieldset className="form-fieldset">
        <legend>バナーサイズ <span className="text-muted">{isEmpty(bannerUrl) ? '(バナー URL 指定時に必須)' : '(必須)'}</span></legend>
        <label className="form-radio">
          <input checked={bannerSize === '200x40'} name="banner_size" onChange={() => setBannerSize('200x40')} type="radio" value="200x40" />
          <span>200x40</span>
        </label>
        <label className="form-radio">
          <input checked={bannerSize === '88x31'} name="banner_size" onChange={() => setBannerSize('88x31')} type="radio" value="88x31" />
          <span>88x31</span>
        </label>
      </fieldset>
      
      {isSelf === 0 && (
        <>
          <div className="form-field">
            <label htmlFor="new-site-form-recommender-name">{recommenderNameDisplayName} <span className="text-muted">(任意・{recommenderNameMaxLength}文字以内)</span></label>
            <input id="new-site-form-recommender-name" maxLength={recommenderNameMaxLength} onChange={event => setRecommenderName(event.target.value)} type="text" value={recommenderName} />
          </div>
          
          <div className="form-field">
            <label htmlFor="new-site-form-recommender-comment">{recommenderCommentDisplayName} <span className="text-muted">(必須・{recommenderCommentMaxLength}文字以内)</span></label>
            <textarea id="new-site-form-recommender-comment" maxLength={recommenderCommentMaxLength} onChange={event => setRecommenderComment(event.target.value)} required rows={5} value={recommenderComment} />
          </div>
        </>
      )}
      
      {isSelf === 1 && (
        <div className="form-field">
          <label htmlFor="new-site-form-password">{passwordDisplayName} <span className="text-muted">(必須・{passwordMaxLength}文字以内)</span></label>
          <input id="new-site-form-password" maxLength={passwordMaxLength} onChange={event => setPassword(event.target.value)} required type="password" value={password} />
        </div>
      )}
      
      <div className="form-field">
        <p className="form-label">Turnstile 認証</p>
        <TurnstileField onTokenChange={setTurnstileToken} />
      </div>
      
      {clientError !== '' && <p className="form-message text-error">{clientError}</p>}
      {serverError !== '' && <p className="form-message text-error">{serverError}</p>}
      
      <div className="form-actions">
        <button disabled={isSubmitting} type="submit">{isSubmitting ? '送信中…' : '登録する'}</button>
        <Link to="/">トップへ戻る</Link>
      </div>
    </form>
  );
}
