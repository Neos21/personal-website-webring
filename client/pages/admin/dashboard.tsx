import { type ReactElement } from 'react';

import { AdminNavigation } from './components/admin-navigation';

export default function AdminDashboard(): ReactElement {
  return (
    <main className="page-container">
      <AdminNavigation />
      <h1>リングマスター管理ダッシュボード</h1>
    </main>
  );
}
