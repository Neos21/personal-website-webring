import { type ReactElement } from 'react';
import { Link } from 'react-router';

export default function Index(): ReactElement {
  return (
    <main className="index-page">
      <h1>個人サイトウェブリング</h1>
      <p><Link to="/new">新規登録</Link></p>
    </main>
  );
}
