import ky from 'ky';
import { useEffect, useState, type ReactElement, type SubmitEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';

import { convertUtcToJst } from '../../../shared/helpers/convert-utc-to-jst';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { isImageUrl } from '../../../shared/helpers/is-image-url';
import { mergeIssues } from '../../../shared/helpers/merge-issues';
import { adminUpdateSiteSchema } from '../../../shared/schemas/admin/admin-site-schema';
import { bannerUrlDisplayName, bannerUrlMaxLength, descriptionDisplayName, descriptionMaxLength, ownerNameDisplayName, ownerNameMaxLength, passwordDisplayName, passwordMaxLength, siteNameDisplayName, siteNameMaxLength, tagDisplayName, tagMaxLength, tagsMax, urlDisplayName, urlMaxLength } from '../../../shared/schemas/site-schema';
import { adminApi } from '../../helpers/admin-api';
import { convertBannerSizeToDimensions, type BannerSize } from '../../helpers/convert-banner-size-to-dimensions';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SiteAdminWithTags } from '../../../shared/types/admin/admin-site';
import type { SiteNameUrl } from '../../../shared/types/site';

export default function AdminSite(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // サイト ID パラメータ (必須)
  const idParam = searchParams.get('id');
  const id      = isEmpty(idParam) ? null : Number(idParam);
  
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
  const [isLoading    , setIsLoading    ] = useState<boolean>(true);
  const [loadError    , setLoadError    ] = useState<string>('');
  const [isDenyDomain , setIsDenyDomain ] = useState<boolean>(false);
  const [exactMatch   , setExactMatch   ] = useState<SiteNameUrl | null>(null);
  const [nearMatch    , setNearMatch    ] = useState<SiteNameUrl | null>(null);
  const [isShownBanner, setIsShownBanner] = useState<boolean>(false);
  const [error        , setError        ] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      // 再読込時のための最低限の初期化
      setIsLoading(true);
      setPassword('');
      
      if(id == null) {
        setLoadError('サイト ID が指定されていません');
        setIsLoading(false);
        return;
      }
      if(!Number.isInteger(id) || id <= 0) {
        setLoadError('サイト ID が不正です');
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await adminApi.get(`/api/admin/sites/${id}`).json<{ result: SiteAdminWithTags; }>();
        setSite(response.result);
        
        setIsSelf       (response.result.is_self);
        setSiteName     (response.result.site_name);
        setUrl          (response.result.url);
        setOwnerName    (response.result.owner_name || '');
        setDescription  (response.result.description || '');
        setTags         (Array.isArray(response.result.tags) && response.result.tags.length > 0 ? response.result.tags.map(tag => tag.name) : []);
        setBannerUrl    (response.result.banner_url || '');
        setBannerSize   (response.result.banner_width === 88 && response.result.banner_height === 31 ? '88x31' : '200x40');
        setIsDeleted    (response.result.is_deleted);
        setIsShownBanner(!isEmpty(response.result.banner_url) && isImageUrl(response.result.banner_url));
      }
      catch(error) {
        setError(extractApiErrorMessage(error, 'サイトの取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [location.key, id]);
  
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
      const response = await ky.get('/api/sites/search-url', { searchParams: { url: inputUrl, id: site!.id } }).json<{ result: { exact_match: SiteNameUrl | null; near_match: SiteNameUrl | null; }; }>();
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
      await adminApi.put(`/api/admin/sites/${id}`, { json: parsed.data }).json();
      navigate(`/admin/site?id=${id}`);
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'サイトの編集に失敗しました'));
    }
  };
  
  const onDelete = async (): Promise<void> => {
    setError('');
    
    if(!window.confirm('本当にサイト情報を削除しますか？\nこの操作は取り消せません。')) return;
    
    try {
      await adminApi.delete(`/api/admin/sites/${id}`);
      navigate('/admin/sites?page=1');
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'サイトの削除に失敗しました'));
    }
  };
  
  return (
    <main>
      <title>サイト編集・削除 - 個人サイトウェブリング</title>
      <h1>サイト編集・削除</h1>
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : !isEmpty(loadError) ? (
        <div className="alert-danger mb-8 font-bold">{loadError}</div>
      ) : site == null ? (
        <div className="alert-danger mb-8 font-bold">対象のサイトが見つかりませんでした</div>
      ) : (
        <form className="mb-8 space-y-4" onSubmit={onSubmit}>
          <table>
            <tbody>
              <tr>
                <th>ID</th>
                <td className="w-full">{site.id}</td>
              </tr>
              <tr>
                <th>登録日時</th>
                <td className="w-full">{convertUtcToJst(site.created_at)}</td>
              </tr>
              <tr>
                <th>更新日時</th>
                <td className="w-full">{convertUtcToJst(site.updated_at)}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="space-y-1">
            <div className="font-bold">登録種別</div>
            <div className="form-radio-buttons">
              <label>
                <input type="radio" name="is_self" value="0" checked={isSelf === 0} onChange={() => setIsSelf(0)} /> 他薦
              </label>
              <label>
                <input type="radio" name="is_self" value="1" checked={isSelf === 1} onChange={() => setIsSelf(1)} /> 自薦
              </label>
            </div>
          </div>
          
          <label>
            <div><span className="font-bold">{siteNameDisplayName}</span> <span className="form-label-memo">(必須・{siteNameMaxLength}文字以内)</span></div>
            <input type="text" placeholder={siteNameDisplayName} value={siteName} maxLength={siteNameMaxLength} onChange={event => setSiteName(event.target.value)} required />
          </label>
          
          <label>
            <div><span className="font-bold">{urlDisplayName}</span> <span className="form-label-memo">(必須・{urlMaxLength}文字以内)</span></div>
            <input type="url" placeholder={urlDisplayName} value={url} maxLength={urlMaxLength}
              onChange={event => { setUrl(event.target.value); setIsDenyDomain(false); setExactMatch(null); setNearMatch(null); }}
              onBlur={() => onBlurUrl(url)}
              required
            />
          </label>
          
          {isDenyDomain && (
            <div className="alert-danger font-bold">このドメインは登録できません</div>
          )}
          {exactMatch != null && (
            <div className="alert-danger">
              <div className="font-bold">この URL は登録済みです</div>
              <div>ID <Link to={{ pathname: '/site', search: `?id=${exactMatch.id}&page=1` }}>[{exactMatch.id}]</Link> {exactMatch.site_name}</div>
              <div><a href={exactMatch.url} target="_blank">{exactMatch.url}</a></div>
            </div>
          )}
          {nearMatch != null && (
            <div className="alert-warning">
              <div className="font-bold">類似する URL が登録されています</div>
              <div>ID <Link to={{ pathname: '/site', search: `?id=${nearMatch.id}&page=1` }}>[{nearMatch.id}]</Link> {nearMatch.site_name}</div>
              <div><a href={nearMatch.url} target="_blank">{nearMatch.url}</a></div>
            </div>
          )}
          
          <label>
            <div><span className="font-bold">{ownerNameDisplayName}</span> <span className="form-label-memo">(任意・{ownerNameMaxLength}文字以内)</span></div>
            <input type="text" placeholder={ownerNameDisplayName} value={ownerName} maxLength={ownerNameMaxLength} onChange={event => setOwnerName(event.target.value)} />
          </label>
          
          <label>
            <div><span className="font-bold">{descriptionDisplayName}</span> <span className="form-label-memo">(任意・{descriptionMaxLength}文字以内)</span></div>
            <textarea placeholder={descriptionDisplayName} value={description} maxLength={descriptionMaxLength} onChange={event => setDescription(event.target.value)} rows={4} />
          </label>
          
          <label>
            <div><span className="font-bold">{tagDisplayName}</span> <span className="form-label-memo">(必須・1〜{tagsMax}個・1つ{tagMaxLength}文字以内)</span></div>
            <div className="flex gap-x-3">
              <input className="flex-1" type="text" placeholder={tagDisplayName} value={tagInput} maxLength={tagMaxLength} onChange={event => setTagInput(event.target.value)}
                onKeyDown={event => {
                  if(event.key !== 'Enter') return;
                  event.preventDefault();
                  onAddTag(tagInput);
                }}
                disabled={tags.length >= tagsMax}
              />
              <button className="flex-none" type="button" onClick={() => onAddTag(tagInput)} disabled={tags.length >= tagsMax}>追加</button>
            </div>
          </label>
          
          {tags.length > 0 && (
            <div className="space-x-2 space-y-2">
              {tags.map((tag, index) => (
                <button type="button" key={`${tag}-${index}`} onClick={() => setTags(prevTags => prevTags.filter((_, i) => i !== index))}>{tag} ×</button>
              ))}
            </div>
          )}
          
          <label>
            <div><span className="font-bold">{bannerUrlDisplayName}</span> <span className="form-label-memo">(任意・{bannerUrlMaxLength}文字以内)</span></div>
            <input type="url" placeholder={bannerUrlDisplayName} value={bannerUrl} maxLength={bannerUrlMaxLength}
              onChange={event => { setIsShownBanner(false); setBannerUrl(event.target.value); }}
              onBlur={() => setIsShownBanner(!isEmpty(bannerUrl) && isImageUrl(bannerUrl))}
            />
          </label>
          
          <div className="space-y-1">
            <div><span className="font-bold">バナーサイズ</span> <span className="form-label-memo">({isEmpty(bannerUrl) ? 'バナー URL 指定時に必須' : '必須'})</span></div>
            <div className="form-radio-buttons">
              <label>
                <input type="radio" name="banner_size" value="200x40" checked={bannerSize === '200x40'} onChange={() => setBannerSize('200x40')} /> 200x40
              </label>
              <label>
                <input type="radio" name="banner_size" value="88x31"  checked={bannerSize === '88x31' } onChange={() => setBannerSize('88x31' )} /> 88x31
              </label>
            </div>
          </div>
          
          {isShownBanner && (
            <img src={bannerUrl}
              width={bannerSize === '200x40' ? 200 : 88} height={bannerSize === '200x40' ? 40 : 31}
              style={{ width: bannerSize === '200x40' ? 200 : 88, height: bannerSize === '200x40' ? 40 : 31 }}
              alt="バナー画像プレビュー" title="バナー画像プレビュー"
            />
          )}
          
          <label>
            <div><span className="font-bold">{passwordDisplayName}</span> <span className="form-label-memo">({passwordMaxLength}文字以内・変更したい場合のみ入力する)</span></div>
            <input type="password" placeholder={passwordDisplayName} value={password} maxLength={passwordMaxLength} onChange={event => setPassword(event.target.value)} />
          </label>
          
          <div>現在のパスワードハッシュ : {site.password_hash}</div>
          
          <label className={`font-bold cursor-pointer ${isDeleted === 1 ? 'text-red-600' : ''}`}>
            <input type="checkbox" checked={isDeleted === 1} onChange={() => setIsDeleted(prevIsDeleted => prevIsDeleted === 1 ? 0 : 1)} /> 論理削除
          </label>
          
          {!isEmpty(error) && (<div className="alert-danger font-bold">{error}</div>)}
          
          <div><button type="submit">編集</button></div>
          
          <div className="form-danger text-right"><button type="button" onClick={onDelete}>物理削除する</button></div>
        </form>
      )}
      
      <div className="text-right"><Link to={{ pathname: '/admin/sites', search: '?page=1' }}>サイト管理</Link> | <Link to="/admin/dashboard">ダッシュボード</Link> | <Link to="/">トップ</Link></div>
    </main>
  );
}
