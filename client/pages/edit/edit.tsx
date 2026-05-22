import ky from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';

import { DeleteSiteForm } from './components/delete-site-form';
import { EditSiteForm } from './components/edit-site-form';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SitePublicWithTags } from '../../../shared/types/site';

export default function Edit(): ReactElement {
  const [searchParams] = useSearchParams();
  
  // サイト ID パラメータ (必須)
  const idParam = searchParams.get('id');
  const siteId  = isEmpty(idParam) ? null : Number(idParam);
  
  // サイト詳細 (子コンポーネントに渡す)
  const [site, setSite] = useState<SitePublicWithTags | null>(null);
  
  // エラー表示系
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  useEffect(() => {
    if(siteId == null) {
      setError('サイト ID が指定されていません');
      setIsLoading(false);
      return;
    }
    if(siteId === 0 || Number.isNaN(siteId)) {
      setError('不正なサイト ID です');
      return setIsLoading(false);
    }
    
    (async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await ky.get(`/api/sites/${siteId}`).json<{ result: SitePublicWithTags; }>();
        setSite(response.result);
      }
      catch(error) {
        setError(extractApiErrorMessage(error, '情報の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [siteId]);
  
  return (
    <main className="page-container">
      <h1>{site?.is_self === 0 ? 'このサイトの管理人ですか？' : '編集・削除'}</h1>
      
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
          {site.is_self === 0 ? (
            <p>このサイトは他薦で登録されています。<br />このサイトの管理人でしたら、新しく管理パスワードを設定してサイトの情報を編集できます。</p>
          ) : (
            <p>サイト情報を編集・削除できます。<br />いずれの操作も実行時に管理パスワードが必要です。</p>
          )}
          
          <EditSiteForm site={site} />
          
          {site.is_self === 1 && (
            <DeleteSiteForm site={site} />
          )}
          
          <p className="text-right">
            <Link to={{ pathname: '/site', search: `?id=${siteId}` }}>サイト詳細へ戻る</Link>
          </p>
        </>
      )}
    </main>
  );
}
