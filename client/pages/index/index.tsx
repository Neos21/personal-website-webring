import { type ReactElement } from 'react';
import { Link } from 'react-router';

export default function Index(): ReactElement {
  return (
    <main className="index-page page-container">
      <h1>個人サイトウェブリング</h1>
      <p><Link to="/new">新規登録</Link></p>
      <p><Link to="/list">登録済サイト一覧</Link></p>
      <p><Link to="/support">サポート掲示板</Link></p>
    </main>
  );
}
