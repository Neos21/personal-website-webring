import { type ReactElement } from 'react';
import { Link } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';

export default function AdminDashboard(): ReactElement {
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>ダッシュボード</h1>
      
      <ul>
        <li><Link to="/admin/sites">登録サイト</Link></li>
        <li><Link to="/admin/tags">タグ</Link></li>
        <li><Link to="/admin/posts">サポート掲示板</Link></li>
        <li><Link to="/admin/deny-ips">IP 制限</Link></li>
        <li><Link to="/admin/deny-domains">禁止ドメイン</Link></li>
      </ul>
    </main>
  );
}
