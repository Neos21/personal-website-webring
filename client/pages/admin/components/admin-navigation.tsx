import { Link, useNavigate } from 'react-router';

import { isAuthenticated, removeJwt } from '../../../helpers/admin-auth';

import type { ReactElement } from 'react';

export function AdminNavigation(): ReactElement {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  
  const onLogout = (): void => {
    removeJwt();
    navigate('/admin');
  };
  
  return (
    <nav>
      <ul className="form-radio-2columns">
        <li><Link to="/admin/dashboard">ダッシュボード</Link></li>
        <li><Link to="/admin/sites">サイト管理</Link></li>
        <li><Link to="/admin/tags">タグ管理</Link></li>
        <li><Link to="/admin/posts">投稿管理</Link></li>
        <li><Link to="/admin/deny-ips">IP 制限管理</Link></li>
        <li><Link to="/admin/deny-domains">禁止ドメイン管理</Link></li>
      </ul>
      {authenticated && (
        <p className="text-right">
          <button type="button" onClick={onLogout}>ログアウト</button>
        </p>
      )}
    </nav>
  );
}
