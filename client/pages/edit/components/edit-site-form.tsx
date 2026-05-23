import ky from 'ky';
import { useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { isEmpty } from '../../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { bannerUrlDisplayName, bannerUrlMaxLength, descriptionDisplayName, descriptionMaxLength, updateSiteSchema, ownerNameDisplayName, ownerNameMaxLength, passwordDisplayName, passwordMaxLength, siteNameDisplayName, siteNameMaxLength, tagDisplayName, tagMaxLength, tagsMax, urlDisplayName, urlMaxLength } from '../../../../shared/schemas/site-schema';
import { TurnstileField } from '../../../components/turnstile-field';
import { convertBannerSizeToDimensions, type BannerSize } from '../../../helpers/convert-banner-size-to-dimensions';
import { extractApiErrorMessage } from '../../../helpers/extract-api-error-message';

import type { SiteNameUrl, SitePublicWithTags } from '../../../../shared/types/site';

type Props = {
  site: SitePublicWithTags;
};

export function EditSiteForm({ site }: Props): ReactElement {
  const navigate = useNavigate();
  
  // 初期値
  const initialBannerSize: BannerSize = site.banner_width === 88 && site.banner_height === 31 ? '88x31' : '200x40';
  const initialTags = Array.isArray(site.tags) && site.tags.length > 0 ? site.tags.map(tag => tag.name) : [];
  
  // 入力フォーム
  const [siteName      , setSiteName      ] = useState<string>(site.site_name);
  const [url           , setUrl           ] = useState<string>(site.url);
  const [ownerName     , setOwnerName     ] = useState<string>(site.owner_name || '');
  const [description   , setDescription   ] = useState<string>(site.description || '');
  const [tags          , setTags          ] = useState<Array<string>>(initialTags);
  const [tagInput      , setTagInput      ] = useState<string>('');
  const [bannerUrl     , setBannerUrl     ] = useState<string>(site.banner_url || '');
  const [bannerSize    , setBannerSize    ] = useState<BannerSize>(initialBannerSize);
  const [password      , setPassword      ] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  
  // エラー表示系
  const [isDenyDomain, setIsDenyDomain] = useState<boolean>(false);
  const [exactMatch  , setExactMatch  ] = useState<SiteNameUrl | null>(null);
  const [nearMatch   , setNearMatch   ] = useState<SiteNameUrl | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error       , setError       ] = useState<string>('');
  
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
      const response = await ky.get('/api/sites/search-url', { searchParams: { url: inputUrl, id: site.id } }).json<{ result: { exact_match: SiteNameUrl | null; near_match: SiteNameUrl | null; }; }>();
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
      site_name      : siteName,
      url            : url,
      owner_name     : ownerName,
      description    : description,
      tags           : tags,
      banner_url     : hasBannerUrl ? bannerUrl    : null,
      banner_width   : hasBannerUrl ? bannerWidth  : null,
      banner_height  : hasBannerUrl ? bannerHeight : null,
      password       : password,
      turnstile_token: turnstileToken
    };
    const parsed = updateSiteSchema.safeParse(payload);
    if(!parsed.success) return setError(mergeIssues(parsed.error));
    
    setIsSubmitting(true);
    try {
      await ky.put(`/api/sites/${site.id}`, { json: parsed.data }).json();
      navigate(`/site?id=${site.id}&page=1`);
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'サイトの編集に失敗しました'));
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={onSubmit}>
      <fieldset>
        <legend>サイト編集</legend>
        
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
            <div>ID <Link to={{ pathname: '/site', search: `?id=${exactMatch.id}&page=1` }}>[{exactMatch.id}]</Link> {exactMatch.site_name}</div>
            <div><a href={exactMatch.url} target="_blank">{exactMatch.url}</a></div>
          </div>
        )}
        {nearMatch != null && (
          <div className="alert-warning">
            <div className="text-warning">類似する URL が登録されています</div>
            <div>ID <Link to={{ pathname: '/site', search: `?id=${nearMatch.id}&page=1` }}>[{nearMatch.id}]</Link> {nearMatch.site_name}</div>
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
          <p className="tags">
            {tags.map((tag, index) => (
              <button type="button" key={`${tag}-${index}`} onClick={() => setTags(prevTags => prevTags.filter((_, i) => i !== index))}>{tag} ×</button>
            ))}
          </p>
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
            <input type="radio" name="banner_size" value="88x31" checked={bannerSize === '88x31'} onChange={() => setBannerSize('88x31')} /> 88x31
          </label>
        </div>
      </fieldset>
      
      <fieldset>
        <legend>{site.is_self === 1 ? passwordDisplayName : `新しい${passwordDisplayName}`}</legend>
        <div className="text-muted">{site.is_self === 1 ? '更新を適用するために管理パスワードを入力してください。' : '自薦に切り替えるため、新しいパスワードを設定してください。'}</div>
        <label>
          <div className="form-label">{passwordDisplayName} <span className="form-label-memo">(必須・{passwordMaxLength}文字以内)</span></div>
          <input type="password" placeholder={passwordDisplayName} value={password} maxLength={passwordMaxLength} onChange={event => setPassword(event.target.value)} required />
        </label>
      </fieldset>
      
      <TurnstileField onTokenChange={setTurnstileToken} />
      
      {!isEmpty(error) && (<p className="text-error">{error}</p>)}
      
      <p><button type="submit" disabled={isSubmitting || isDenyDomain || exactMatch != null}>{isSubmitting ? '送信中…' : '編集する'}</button></p>
    </form>
  );
}
