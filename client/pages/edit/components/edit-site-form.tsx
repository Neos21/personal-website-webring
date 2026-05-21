import ky from 'ky';
import { useState, type ReactElement, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router';

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
  siteNameDisplayName,
  siteNameMaxLength,
  tagDisplayName,
  tagMaxLength,
  tagsMax,
  urlDisplayName,
  urlMaxLength
} from '../../../../shared/schemas/site-schema';
import { TurnstileField } from '../../../components/turnstile-field';
import { extractApiErrorMessage } from '../../../helpers/extract-api-error-message';

import type { SitePublic } from '../../../../shared/types/site';

type BannerSize = '200x40' | '88x31';

type Props = {
  site: SitePublic;
};

const bannerSizeToDimensions = (bannerSize: BannerSize): { banner_height: number; banner_width: number; } => {
  if(bannerSize === '88x31') return { banner_height: 31, banner_width: 88 };
  return { banner_height: 40, banner_width: 200 };
};

export function EditSiteForm({ site }: Props): ReactElement {
  const navigate = useNavigate();
  
  const initialBannerSize: BannerSize = site.banner_width === 88 && site.banner_height === 31 ? '88x31' : '200x40';
  
  const [siteName          , setSiteName          ] = useState<string>(site.site_name);
  const [url               , setUrl               ] = useState<string>(site.url);
  const [ownerName         , setOwnerName         ] = useState<string>(site.owner_name || '');
  const [description       , setDescription       ] = useState<string>(site.description || '');
  const [tagsInput         , setTagsInput         ] = useState<string>('');  // TODO : タグは API レスポンスに含まれていないため空で初期化 (実際には tags API がないので今回は別途対応するか、上書きになる)
  const [bannerUrl         , setBannerUrl         ] = useState<string>(site.banner_url || '');
  const [bannerSize        , setBannerSize        ] = useState<BannerSize>(initialBannerSize);
  const [password          , setPassword          ] = useState<string>('');
  const [turnstileToken    , setTurnstileToken    ] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [clientError , setClientError ] = useState<string>('');
  const [serverError , setServerError ] = useState<string>('');
  
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
      is_self            : 1,  // 編集時は必ず自薦扱いにする
      owner_name         : ownerName,
      password           : password,
      recommender_comment: null,
      recommender_name   : null,
      site_name          : siteName,
      tags               : tagsInput,
      turnstile_token    : turnstileToken,
      url                : url
    };
    const parsedResult = newSiteSchema.safeParse(payload);
    if(!parsedResult.success) return setClientError(mergeIssues(parsedResult.error));
    
    setIsSubmitting(true);
    try {
      const response = await ky.put(`/api/sites/${site.id}`, { json: parsedResult.data }).json<{ result: { id: number; tags: Array<string>; warning: string | null; }; }>();
      navigate(`/site?id=${response.result.id}`, { state: { warning: response.result.warning } });
    }
    catch(error) {
      const errorMessage = await extractApiErrorMessage(error, '更新に失敗しました');
      setServerError(errorMessage);
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={onSubmit} style={{ marginBottom: '2rem' }}>
      <fieldset>
        <legend>サイト情報編集</legend>
        
        <label>
          <div className="form-label">{siteNameDisplayName} <span className="form-label-memo">(必須・{siteNameMaxLength}文字以内)</span></div>
          <input type="text" placeholder={siteNameDisplayName} value={siteName} maxLength={siteNameMaxLength} onChange={event => setSiteName(event.target.value)} required />
        </label>
        
        <label>
          <div className="form-label">{urlDisplayName} <span className="form-label-memo">(必須・{urlMaxLength}文字以内)</span></div>
          <input type="url" placeholder={urlDisplayName} value={url} maxLength={urlMaxLength} onChange={event => setUrl(event.target.value)} required />
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
          {/* Note : tags は API の戻り値に含まれていないため空欄で表示しています。更新時はここに入力した値で上書きされます。 */}
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
      
      <fieldset>
        <legend>{site.is_self === 1 ? passwordDisplayName : '新しい' + passwordDisplayName}</legend>
        <p className="form-label-memo">{site.is_self === 1 ? '更新を適用するために現在のパスワードを入力してください。変更する場合は新しいパスワードを入力してください。' : '自薦に切り替えるため、新しいパスワードを設定してください。'}</p>
        <label>
          <div className="form-label">{passwordDisplayName} <span className="form-label-memo">(必須・{passwordMaxLength}文字以内)</span></div>
          <input type="password" placeholder={passwordDisplayName} value={password} maxLength={passwordMaxLength} onChange={event => setPassword(event.target.value)} required />
        </label>
      </fieldset>
      
      <TurnstileField onTokenChange={setTurnstileToken} />
      
      {!isEmpty(clientError) && <p className="text-error">{clientError}</p>}
      {!isEmpty(serverError) && <p className="text-error">{serverError}</p>}
      
      <p><button type="submit" disabled={isSubmitting}>{isSubmitting ? '送信中…' : '更新する'}</button></p>
    </form>
  );
}
