import ky from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';

import { SiteCard } from './components/site-card';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SitePublicWithTags } from '../../../shared/types/site';

export default function List(): ReactElement {
  const [searchParams] = useSearchParams();
  
  const pageParam  = searchParams.get('page');
  const pageNumber = isEmpty(pageParam) ? 1 : Number(pageParam);
  const page       = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  
  const [sites    , setSites    ] = useState<Array<SitePublicWithTags>>([]);
  const [hasNext  , setHasNext  ] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await ky.get(`/api/sites?page=${page}`).json<{ result: { page: number; sites: Array<SitePublicWithTags>; has_next: boolean; }; }>();
        setSites(response.result.sites);
        setHasNext(response.result.has_next);
      }
      catch(error) {
        const errorMessage = await extractApiErrorMessage(error, '一覧の取得に失敗しました');
        setError(errorMessage);
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [page]);
  
  return (
    <main className="list-page page-container">
      <h1>登録済サイト一覧</h1>
      
      {isLoading ? (
        <p>読み込み中…</p>
      ) : !isEmpty(error) ? (
        <p className="text-error">{error}</p>
      ) : sites.length === 0 ? (
        <p>登録されているサイトはありません。</p>
      ) : (
        <>
          <div className="site-list">
            {sites.map(site => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
          
          <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            {page > 1 && (
              <Link to={{ pathname: '/list', search: `?page=${page - 1}` }}>&laquo; 前のページ</Link>
            )}
            
            {hasNext && (
              <Link to={{ pathname: '/list', search: `?page=${page + 1}` }}>次のページ &raquo;</Link>
            )}
          </div>
        </>
      )}
      
      <p className="text-right" style={{ marginTop: '2rem' }}>
        <Link to="/">トップへ戻る</Link>
      </p>
    </main>
  );
}
