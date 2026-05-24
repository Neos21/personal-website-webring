import { type ReactElement } from 'react';
import { Link } from 'react-router';

export default function Index(): ReactElement {
  return (
    <main>
      <title>個人サイトウェブリング</title>
      <h1>個人サイトウェブリング</h1>
      
      <p className="text-center"><Link to="/new">新規登録</Link> | <Link to={{ pathname: '/list', search: '?page=1' }}>登録サイト一覧</Link> | <Link to={{ pathname: '/support', search: '?page=1' }}>サポート掲示板</Link></p>
      
      {/* TODO : コンセプト */}
    </main>
  );
}
