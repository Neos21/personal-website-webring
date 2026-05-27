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
    (async () => {
      if(siteId == null) {
        setError('サイト ID が指定されていません');
        setIsLoading(false);
        return;
      }
      if(!Number.isInteger(siteId) || siteId <= 0) {
        setError('サイト ID が不正です');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError('');
      
      try {
        const response = await ky.get(`/api/sites/${siteId}`).json<{ result: SitePublicWithTags; }>();
        setSite(response.result);
      }
      catch(error) {
        setError(extractApiErrorMessage(error, 'サイトの取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [siteId]);
  
  return (
    <main>
      <title>サイト編集・削除 - 個人サイトウェブリング</title>
      <h1>サイト編集・削除</h1>
      
      {isLoading ? (
        <div className="loading mb-8">読み込み中…</div>
      ) : !isEmpty(error) ? (
        <div className="alert-danger mb-8 font-bold">{error}</div>
      ) : site == null ? (
        <div className="alert-danger mb-8 font-bold">対象のサイトが見つかりませんでした</div>
      ) : (
        <>
          {site.is_self === 0 ? (
            <>
              <div>このサイトは他薦で登録されています。</div>
              <div className="mb-8">あなたがこのサイトの管理人でしたら、新しく管理パスワードを設定してサイトの情報を編集できます。</div>
            </>
          ) : (
            <>
              <div>サイト情報を編集・削除できます。</div>
              <div className="mb-8">いずれの操作も実行時に管理パスワードが必要です。</div>
            </>
          )}
          
          <EditSiteForm site={site} />
          
          {site.is_self === 1 && (<DeleteSiteForm site={site} />)}
          
          <div className="mb-2 text-right"><Link to={{ pathname: '/site', search: `?id=${siteId}&page=1` }}>サイト詳細へ戻る</Link></div>
        </>
      )}
      
      <div className="mb-2 text-right"><Link to={{ pathname: '/list', search: '?page=1' }}>登録サイト一覧へ戻る</Link></div>
      <div className="text-right"><Link to="/">トップへ戻る</Link></div>
    </main>
  );
}
