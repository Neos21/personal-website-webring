import { isHTTPError } from 'ky';
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { adminApi } from '../../helpers/admin-api';
import { removeJwt } from '../../helpers/admin-auth';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SiteAdmin } from '../../../shared/types/site';
import type { Tag } from '../../../shared/types/tag';

export default function AdminSite(): ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  const id = idParam == null ? null : Number(idParam);
  
  const [site, setSite] = useState<SiteAdmin | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fetchSite = async (): Promise<void> => {
    if(id == null) return;
    setError('');
    setIsLoading(true);
    try {
      const response = await adminApi.get(`/api/admin/sites/${id}`).json<{ result: { site: SiteAdmin; tags: Array<Tag> } }>();
      setSite(response.result.site);
      setTagsInput(response.result.tags.map(t => t.name).join(' '));
    }
    catch(error) {
      if(isHTTPError(error) && error.response.status === 401) {
        removeJwt();
        navigate('/admin', { replace: true });
        return;
      }
      setError(extractApiErrorMessage(error, 'サイト情報の取得に失敗しました'));
    }
    finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    void fetchSite();
  }, [id]);
  
  const buildRequestBody = (): { site_name: string; url: string; owner_name: string | null; description: string | null; tags: string[]; banner_url: string | null; banner_width: number | null; banner_height: number | null; password: string | null; is_deleted: 0 | 1; } => {
    return {
      site_name: site?.site_name ?? '',
      url: site?.url ?? '',
      owner_name: site?.owner_name ?? null,
      description: site?.description ?? null,
      tags: tagsInput.trim() === '' ? [] : tagsInput.split(/[\s,]+/).map(s => s.trim()).filter(Boolean),
      banner_url: site?.banner_url ?? null,
      banner_width: site?.banner_width ?? null,
      banner_height: site?.banner_height ?? null,
      password: site?.password_hash ?? null,
      is_deleted: site?.is_deleted === 1 ? 1 : 0
    };
  };
  
  const handleUpdate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if(id == null || site == null) return;
    setError('');
    setIsSubmitting(true);
    try {
      await adminApi.put(`/api/admin/sites/${id}`, { json: buildRequestBody() });
      await fetchSite();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, 'サイトの更新に失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSetDeleted = async (isDeleted: 0 | 1, message: string): Promise<void> => {
    if(id == null || site == null) return;
    if(isDeleted === 1 && !window.confirm('このサイトを論理削除しますか？')) return;
    setError('');
    setIsSubmitting(true);
    try {
      await adminApi.put(`/api/admin/sites/${id}`, { json: { ...buildRequestBody(), is_deleted: isDeleted } });
      await fetchSite();
    }
    catch(error) {
      setError(extractApiErrorMessage(error, message));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePhysicalDelete = async (): Promise<void> => {
    if(id == null) return;
    const confirmed = window.confirm('このサイトを完全に削除します。元に戻せません。よろしいですか？');
    if(!confirmed) return;
    setError('');
    setIsSubmitting(true);
    try {
      await adminApi.delete(`/api/admin/sites/${id}`);
      navigate('/admin/sites');
    }
    catch(error) {
      setError(extractApiErrorMessage(error, '物理削除に失敗しました'));
    }
    finally {
      setIsSubmitting(false);
    }
  };
  
  if(id == null) return <main className="page-container"><AdminNavigation /><p className="text-error">ID パラメータが指定されていません</p></main>;
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>サイト編集</h1>
      
      {isLoading ? (
        <p>読み込み中…</p>
      ) : error !== '' ? (
        <p className="text-error">{error}</p>
      ) : site == null ? (
        <p>サイトが見つかりませんでした。</p>
      ) : (
        <form onSubmit={handleUpdate} className="form-grid">
          <label>
            サイト名
            <input value={site.site_name} onChange={e => setSite({ ...site, site_name: e.target.value })} />
          </label>
          <label>
            URL
            <input value={site.url} onChange={e => setSite({ ...site, url: e.target.value })} />
          </label>
          <label>
            管理人名
            <input value={site.owner_name ?? ''} onChange={e => setSite({ ...site, owner_name: e.target.value })} />
          </label>
          <label>
            説明
            <textarea value={site.description ?? ''} onChange={e => setSite({ ...site, description: e.target.value })} />
          </label>
          <label>
            タグ（スペース区切り）
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
          </label>
          <label>
            バナー URL
            <input value={site.banner_url ?? ''} onChange={e => setSite({ ...site, banner_url: e.target.value })} />
          </label>
          <label>
            バナー幅
            <input type="number" value={site.banner_width ?? ''} onChange={e => setSite({ ...site, banner_width: e.target.value === '' ? null : Number(e.target.value) })} />
          </label>
          <label>
            バナー高さ
            <input type="number" value={site.banner_height ?? ''} onChange={e => setSite({ ...site, banner_height: e.target.value === '' ? null : Number(e.target.value) })} />
          </label>
          <div>
            <button type="submit" disabled={isSubmitting}>保存</button>
            {site.is_deleted === 1 ? (
              <button type="button" onClick={() => void handleSetDeleted(0, '復元に失敗しました')} disabled={isSubmitting}>復元</button>
            ) : (
              <button type="button" onClick={() => void handleSetDeleted(1, '論理削除に失敗しました')} disabled={isSubmitting}>論理削除</button>
            )}
            <button type="button" onClick={() => void handlePhysicalDelete()} disabled={isSubmitting}>物理削除</button>
          </div>
        </form>
      )}
    </main>
  );
}
