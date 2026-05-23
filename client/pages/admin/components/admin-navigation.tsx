import { Link, useNavigate } from 'react-router';

import { useAdminStore } from '../../../stores/admin-store';

import type { ReactElement } from 'react';

export function AdminNavigation(): ReactElement {
  const navigate = useNavigate();
  
  const onLogout = (): void => {
    useAdminStore.getState().logout();
    navigate('/admin');
  };
  
  return (
    <nav>
      <ul>
        <li><Link to="/admin/dashboard">ダッシュボード</Link></li>
        <li><Link to={{ pathname: '/admin/sites', search: '?page=1' }}>サイト管理</Link></li>
        <li><Link to={{ pathname: '/admin/site-comments', search: '?page=1' }}>サイト別コメント管理</Link></li>
        <li><Link to={{ pathname: '/admin/posts', search: '?page=1' }}>サポート掲示板投稿管理</Link></li>
        <li><Link to={{ pathname: '/admin/tags', search: '?page=1' }}>タグ管理</Link></li>
        <li><Link to="/admin/deny-ips">禁止 IP アドレス管理</Link></li>
        <li><Link to="/admin/deny-domains">禁止ドメイン管理</Link></li>
        <li><button type="button" onClick={onLogout}>ログアウト</button></li>
      </ul>
    </nav>
  );
}
