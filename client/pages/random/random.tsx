import ky from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';

import { appConstants } from '../../../shared/constants/app-constants';
import { isEmpty } from '../../../shared/helpers/is-empty';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { SiteNameUrl } from '../../../shared/types/site';

export default function Random(): ReactElement {
  const [searchParams] = useSearchParams();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [site     , setSite     ] = useState<SiteNameUrl | null>(null);
  const [error    , setError    ] = useState<string>('');
  
  useEffect(() => {
    setIsLoading(true);
    setSite(null);
    setError('');
    
    (async () => {
      try {
        const idParam  = searchParams.get('id');
        const idNumber = isEmpty(idParam) ? null : Number(idParam);
        const id       = idNumber != null && (!Number.isInteger(idNumber) || idNumber <= 0) ? null : idNumber;
        
        const response = await ky.get(`/api/random${id != null ? '?id=' + id : ''}`).json<{ result: SiteNameUrl; }>();
        console.log('Random', response.result);
        location.href = response.result.url;  // 遷移開始
        setSite(response.result);
      }
      catch(error) {
        console.error(error);
        setError(extractApiErrorMessage(error, 'ランダムジャンプできませんでした'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [searchParams]);
  
  return (
    <main>
      <title>個人サイトウェブリング</title>
      
      {!isLoading && !isEmpty(error) && (
        <>
          <h1 title="ランダムジャンプ">{appConstants.siteNameJapanese}</h1>
          <div className="mb-8 p-4 text-red-600 text-center bg-red-50">{error}</div>
          <div className="text-center"><Link to="/">トップへ戻る</Link></div>
        </>
      )}
      
      {!isLoading && site != null && (
        <div className="fade-redirect">
          <h1 title="ランダムジャンプ">{appConstants.siteNameJapanese}</h1>
          <div className="mb-8 p-4 text-center bg-emerald-50">
            <a className="inline-flex flex-col gap-y-2 text-emerald-600 hover:text-sky-600" href={site.url}>
              <span className="font-bold">{site.site_name}</span>
              <span>へ Go!</span>
            </a>
          </div>
          <div className="text-center"><Link to="/">トップへ戻る</Link></div>
        </div>
      )}
    </main>
  );
}
