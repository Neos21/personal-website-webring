import { type ReactElement } from 'react';
import { Link } from 'react-router';

import { AdminNavigation } from './components/admin-navigation';

export default function AdminDashboard(): ReactElement {
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>管理ダッシュボード</h1>
      
      <ul>
        <li>登録サイト: <Link to="/admin/sites">サイト管理へ</Link></li>
        <li>タグ: <Link to="/admin/tags">タグ管理へ</Link></li>
        <li>投稿: <Link to="/admin/posts">投稿管理へ</Link></li>
        <li>IP 制限: <Link to="/admin/deny-ips">IP 制限管理へ</Link></li>
      </ul>
    </main>
  );
}
