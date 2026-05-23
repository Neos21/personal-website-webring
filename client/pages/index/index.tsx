import { type ReactElement } from 'react';
import { Link } from 'react-router';

export default function Index(): ReactElement {
  return (
    <main className="page-container">
      <h1>個人サイトウェブリング</h1>
      <p><Link to="/new">新規登録</Link></p>
      <p><Link to={{ pathname: '/list', search: '?page=1' }}>登録済サイト一覧</Link></p>
      <p><Link to={{ pathname: '/support', search: '?page=1' }}>サポート掲示板</Link></p>
    </main>
  );
}
