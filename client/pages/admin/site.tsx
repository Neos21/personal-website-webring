import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { adminUpdateSiteSchema } from '../../../shared/schemas/admin/admin-site-schema';
import { bannerUrlDisplayName, bannerUrlMaxLength, descriptionDisplayName, descriptionMaxLength, ownerNameDisplayName, ownerNameMaxLength, passwordDisplayName, passwordMaxLength, siteNameDisplayName, siteNameMaxLength, tagDisplayName, tagMaxLength, tagsMax, urlDisplayName, urlMaxLength } from '../../../shared/schemas/site-schema';
import { adminApi } from '../../helpers/admin-api';
import { convertBannerSizeToDimensions, type BannerSize } from '../../helpers/convert-banner-size-to-dimensions';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SiteAdminWithTags } from '../../../shared/types/admin/admin-site';

export default function AdminSite(): ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // サイト ID パラメータ (必須)
  const idParam       = searchParams.get('id');
  const siteId        = isEmpty(idParam) ? null : Number(idParam);
  const isValidSiteId = siteId != null && Number.isInteger(siteId) && siteId > 0;
  
  // サイト詳細 (表示専用)
  const [site, setSite] = useState<SiteAdminWithTags | null>(null);
  
  // 入力フォーム
  const [isSelf     , setIsSelf     ] = useState<0 | 1>(0);
  const [siteName   , setSiteName   ] = useState<string>('');
  const [url        , setUrl        ] = useState<string>('');
  const [ownerName  , setOwnerName  ] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tags       , setTags       ] = useState<Array<string>>([]);
  const [tagInput   , setTagInput   ] = useState<string>('');
  const [bannerUrl  , setBannerUrl  ] = useState<string>('');
  const [bannerSize , setBannerSize ] = useState<BannerSize>('200x40');
  const [password   , setPassword   ] = useState<string>('');
  const [isDeleted  , setIsDeleted  ] = useState<0 | 1>(0);
  
  // エラー表示系
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  useEffect(() => {
    if(siteId == null) {
      setError('サイト ID が指定されていません');
      setIsLoading(false);
      return;
    }
    if(!isValidSiteId) {
      setError('サイト ID が不正です');
      setIsLoading(false);
      return;
    }
    
    (async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await adminApi.get(`/api/admin/sites/${siteId}`).json<{ result: SiteAdminWithTags; }>();
        setSite(response.result);
        
        setIsSelf     (response.result.is_self);
        setSiteName   (response.result.site_name);
        setUrl        (response.result.url);
        setOwnerName  (response.result.owner_name || '');
        setDescription(response.result.description || '');
        setTags       (Array.isArray(response.result.tags) && response.result.tags.length > 0 ? response.result.tags.map(tag => tag.name) : []);
        setBannerUrl  (response.result.banner_url || '');
        setBannerSize (response.result.banner_width === 88 && response.result.banner_height === 31 ? '88x31' : '200x40');
        setIsDeleted  (response.result.is_deleted);
      }
      catch(error) {
        setError(extractApiErrorMessage(error, '情報の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [siteId]);
  
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
      is_self      : isSelf,
      site_name    : siteName,
      url          : url,
      owner_name   : ownerName,
      description  : description,
      tags         : tags,
      banner_url   : hasBannerUrl ? bannerUrl    : null,
      banner_width : hasBannerUrl ? bannerWidth  : null,
      banner_height: hasBannerUrl ? bannerHeight : null,
      password     : password,
      is_deleted   : isDeleted
    };
    const parsed = adminUpdateSiteSchema.safeParse(payload);
    if(!parsed.success) return setError(mergeIssues(parsed.error));
    
    try {
      await adminApi.put(`/api/admin/sites/${siteId}`, { json: parsed.data }).json();
      navigate(`/admin/site?${siteId}`);  // 再読込する
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '編集に失敗しました'));
    }
  };
  
  const onDelete = async (): Promise<void> => {
    if(!window.confirm('本当にこのサイトを削除しますか？\nこの操作は取り消せません。')) return;
    
    setError('');
    try {
      await adminApi.delete(`/api/admin/sites/${siteId}`);
      navigate('/admin/sites');
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '物理削除に失敗しました'));
    }
  };
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>サイト編集・削除</h1>
      
      {isLoading ? (
        <p className="loading">読み込み中…</p>
      ) : !isEmpty(error) ? (
        <p className="text-error">{error}</p>
      ) : site == null ? (
        <p className="text-error">サイトが見つかりませんでした。</p>
      ) : (
        <form onSubmit={onSubmit}>
          <label>
            <div className="form-label">ID</div>
            <div>{site.id}</div>
          </label>
          <label>
            <div className="form-label">登録日時</div>
            <div>{convertUtcToJst(site.created_at)}</div>
          </label>
          <label>
            <div className="form-label">更新日時</div>
            <div>{convertUtcToJst(site.updated_at)}</div>
          </label>
          
          <div className="form-label">登録種別</div>
          <div className="form-radio-2columns">
            <label>
              <input type="radio" name="is_self" value="0" checked={isSelf === 0} onChange={() => setIsSelf(0)} /> 他薦
            </label>
            <label>
              <input type="radio" name="is_self" value="1" checked={isSelf === 1} onChange={() => setIsSelf(1)} /> 自薦
            </label>
          </div>
          
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
          
          <label>
            <div className="form-label">{passwordDisplayName} <span className="form-label-memo">({passwordMaxLength}文字以内・{passwordDisplayName}を変更したい場合のみ入力する)</span></div>
            <input type="password" placeholder={passwordDisplayName} value={password} maxLength={passwordMaxLength} onChange={event => setPassword(event.target.value)} />
          </label>
          <div className="text-muted">現在の{passwordDisplayName} : {site.password_hash}</div>
          
          <p><button type="submit">編集</button></p>
          
          <p className="form-delete text-right"><button type="button" onClick={() => onDelete()}>物理削除</button></p>
        </form>
      )}
    </main>
  );
}
