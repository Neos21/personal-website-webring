import ky from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';

import { SiteCard } from './components/site-card';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SitePublic } from '../../../shared/types/site';

export default function List(): ReactElement {
  const [searchParams] = useSearchParams();
  
  const pageParam = searchParams.get('page');
  const page = isEmpty(pageParam) ? 1 : Number(pageParam);
  
  const [sites    , setSites    ] = useState<Array<SitePublic>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error    , setError    ] = useState<string>('');
  
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await ky.get(`/api/sites?page=${page}`).json<{ result: { page: number; sites: Array<SitePublic>; }; }>();
        setSites(response.result.sites);
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
  
  // TODO : `shared/constants/` で1ページの件数をサーバ・クライアントで共通管理するようにして、1ページの件数を変更可能にする
  // TODO : 次ページが存在するか否かを API 側で判別してレスポンスに含める
  const hasNextPage = sites.length === 100;  // 仮に100件取得できていたら次ページがある可能性が高い (正確な総件数が API から返らない前提)
  
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
            {page > 1 ? (
              <Link to={`/list?page=${page - 1}`}>&laquo; 前のページ</Link>
            ) : (
              <span></span>
            )}
            
            {hasNextPage && (
              <Link to={`/list?page=${page + 1}`}>次のページ &raquo;</Link>
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
