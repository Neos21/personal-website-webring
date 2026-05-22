import { isHTTPError } from 'ky';
import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate, Link } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';
import { adminApi } from '../../helpers/admin-api';
import { removeJwt } from '../../helpers/admin-auth';
import { extractApiErrorMessage } from '../../helpers/extract-api-error-message';

import type { DenyIp } from '../../../shared/types/deny-ip';
import type { PostAdmin } from '../../../shared/types/post';
import type { SiteAdmin } from '../../../shared/types/site';
import type { Tag } from '../../../shared/types/tag';

export default function AdminDashboard(): ReactElement {
  const navigate = useNavigate();
  const [siteCount, setSiteCount] = useState<number>(0);
  const [tagCount, setTagCount] = useState<number>(0);
  const [postCount, setPostCount] = useState<number>(0);
  const [denyIpCount, setDenyIpCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const [sitesResponse, tagsResponse, postsResponse, denyIpsResponse] = await Promise.all([
          adminApi.get('/api/admin/sites').json<{ result: Array<SiteAdmin> }>(),
          adminApi.get('/api/admin/tags').json<{ result: Array<Tag> }>(),
          adminApi.get('/api/admin/posts?page=1').json<{ result: { posts: Array<PostAdmin> } }>(),
          adminApi.get('/api/admin/deny-ips').json<{ result: Array<DenyIp> }>()
        ]);
        
        setSiteCount(sitesResponse.result.length);
        setTagCount(tagsResponse.result.length);
        setPostCount(postsResponse.result.posts.length);
        setDenyIpCount(denyIpsResponse.result.length);
      }
      catch(error) {
        if(isHTTPError(error) && error.response.status === 401) {
          removeJwt();
          navigate('/admin', { replace: true });
          return;
        }
        
        setError(await extractApiErrorMessage(error, 'ダッシュボード情報の取得に失敗しました'));
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, [navigate]);
  
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>管理ダッシュボード</h1>
      
      {isLoading ? (
        <p>読み込み中…</p>
      ) : error !== '' ? (
        <p className="text-error">{error}</p>
      ) : (
        <ul>
          <li>登録サイト: {siteCount}件 <Link to="/admin/sites">サイト管理へ</Link></li>
          <li>タグ: {tagCount}件 <Link to="/admin/tags">タグ管理へ</Link></li>
          <li>投稿: {postCount}件 <Link to="/admin/posts">投稿管理へ</Link></li>
          <li>IP 制限: {denyIpCount}件 <Link to="/admin/deny-ips">IP 制限管理へ</Link></li>
        </ul>
      )}
    </main>
  );
}
