import { type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router';

import { useAdminStore } from '../../stores/admin-store';

export default function AdminDashboard(): ReactElement {
  const navigate = useNavigate();
  
  const onLogout = (): void => {
    useAdminStore.getState().logout();
    navigate('/admin');
  };
  
  return (
    <main>
      <title>リングマスター管理ダッシュボード - 個人サイトウェブリング</title>
      <h1>リングマスター管理ダッシュボード</h1>
      
      <ul className="mb-8 pl-6 list-disc">
        <li><Link to={{ pathname: '/admin/sites', search: '?page=1' }}>サイト管理</Link></li>
        <li><Link to="/admin/site-ips">サイト操作 IP アドレス履歴管理</Link></li>
        <li><Link to={{ pathname: '/admin/site-comments', search: '?page=1' }}>サイト別コメント管理</Link></li>
        <li><Link to={{ pathname: '/admin/posts', search: '?page=1' }}>サポート掲示板投稿管理</Link></li>
        <li><Link to={{ pathname: '/admin/tags', search: '?page=1' }}>タグ管理</Link></li>
        <li><Link to="/admin/deny-ips">禁止 IP アドレス管理</Link></li>
        <li><Link to="/admin/deny-domains">禁止ドメイン管理</Link></li>
      </ul>
      
      <div className="mb-8 text-right"><button type="button" onClick={onLogout}>ログアウト</button></div>
      
      <div className="text-right"><Link to="/">トップへ戻る</Link></div>
    </main>
  );
}
