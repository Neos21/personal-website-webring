import ky from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';

import { DeleteSiteForm } from './components/delete-site-form';
import { EditSiteForm } from './components/edit-site-form';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SitePublic } from '../../../shared/types/site';

export default function Edit(): ReactElement {
  const [searchParams] = useSearchParams();
  
  const idParam = searchParams.get('id');
  const siteId = isEmpty(idParam) ? null : Number(idParam);
  
  const [site     , setSite     ] = useState<SitePublic | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  useEffect(() => {
    if(siteId == null) {
      setError('サイト ID が指定されていません');
      setIsLoading(false);
      return;
    }
    
    (async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await ky.get(`/api/sites/${siteId}`).json<{ result: SitePublic; }>();
        setSite(response.result);
      }
      catch(err) {
        const errorMessage = await extractApiErrorMessage(err, '情報の取得に失敗しました');
        setError(errorMessage);
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [siteId]);
  
  return (
    <main className="edit-page page-container">
      <h1>{site?.is_self === 0 ? 'このサイトの管理人ですか？' : '編集・削除'}</h1>
      
      {isLoading ? (
        <p>読み込み中…</p>
      ) : !isEmpty(error) ? (
        <p className="text-error">{error}</p>
      ) : site == null ? (
        <p>サイトが見つかりませんでした。</p>
      ) : (
        <>
          {site.is_self === 0 ? (
            <p>
              このサイトは他薦で登録されています。<br />
              自薦サイトに切り替えることで、以降は情報を編集できるようになります。新しい管理パスワードを設定して更新してください。
            </p>
          ) : (
            <p>
              サイト情報を編集・削除できます。<br />
              いずれの操作も実行時に管理パスワードが必要です。
            </p>
          )}
          
          <EditSiteForm site={site} />
          
          {site.is_self === 1 && (
            <DeleteSiteForm site={site} />
          )}
          
          <p className="text-right" style={{ marginTop: '2rem' }}>
            <Link to={`/site?id=${siteId}`}>サイト詳細へ戻る</Link>
          </p>
        </>
      )}
    </main>
  );
}
