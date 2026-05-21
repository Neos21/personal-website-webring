import type { ReactElement } from 'react';

import { NewSiteForm } from '../../components/new-site-form';

export default function New(): ReactElement {
  return (
    <main className="new-page">
      <h1>新規登録</h1>
      <p className="text-muted">個人サイトをウェブリングに登録します。他薦・自薦を選んでフォームに入力してください。</p>
      <NewSiteForm />
    </main>
  );
}
