# TASKS.md

@AGENTS.md を遵守しながら実装すること。


## 平仄合わせ

- [ ] `{condition && <p>Text</p>}` のように JSX をカッコで囲んでいない場所を直す
  - → `{condition && (<p>Text</p>)}` が正
  - `{condition ? <p>True</p> : <p>False</p>}` の場合も同様に直す
- [ ] 型定義のセミコロンを付けていない場所を直す
  - `ky.get('/api').json<{ result: { text: string } }>` は `ky.get('/api').json<{ result: { text: string; }; }>` のように直す
- [ ] `useState('')` のように型注釈がないところに明示的に型を書く (`useState<string>('')` のように)
- [ ] 主に Submit イベント周りで非推奨の型定義を使わない
  - `import { type SubmitEvent } from 'react'` を使う
- [ ]`== null`・`!= null` で null・undefined の判定をする場所はそのまま。
  空文字とのチェックがある場合は `isEmpty()` を使う。自前で `text.trim()` などをしない
- [ ] `useEffect` に不要な依存関係があれば消す
- [ ] 未使用の CSS クラス名があれば削除する
- [ ] `style` 属性は削除する
- [ ] input・button の type 属性がないものは付ける
- [ ] `if(stringText)` や `{stringText && <p>Text</p>}` のように、`boolean` 型以外の変数について暗黙型変換を利用して条件分岐に使用しない。`isEmpty(stringText)` のように `boolean` で判定すること


## リングマスター用管理画面 (`/admin` 配下) を実装する

- [x] 管理ログイン
- サイト管理
  - [x] 一覧表示ページ : 500件でページング可能にする (`shared/constants/admin.ts` に `export const adminConstants = { sitesPageSize: 500 }` を作る)
  - [x] 1件の詳細表示ページ : 全項目の編集 (論理削除フラグの ON・OFF 込み) を可能にする。物理削除を可能にする。(`site_tags` テーブルの連動削除も行う)
- タグ管理
  - [x] 一覧ページ : 500件でページング可能にする (`adminConstants.tagsPageSize: 500` を用意する)
  - [x] `[ タグ名 ]　　[編集] [削除]` とテキストボックス、ボタンを横並びにして1行を構成する。タグ名の表記を書き換えて「編集」ボタンを押せばその場で更新できる
  - [x] 「削除」ボタンを押せばそのタグを削除できる。そのタグが紐付いているサイトが存在している場合は削除不可にする
- サポート投稿管理
  - [x] 一覧ページ : 500件でページング可能にする (`adminConstants.postsPageSize: 500` を用意する)。一覧ページ上部に「管理者投稿フォーム」を用意する
  - [ ] 投稿1件の詳細表示ページ : その投稿の全項目の編集を可能にする。物理削除を可能にする
- IP 制限管理
  - [x] 一覧ページ : 新規追加と、登録済みのものの削除を可能にする
  - [x] IPv6 アドレスを新規登録する場合は、完全展開したアドレスの上位64ビットまで (例 : `2001:0db8:0000:0000::/64` 形式) に変換して登録する (`convertIpV6AddressTo64Bit` 関数を利用)
  - [x] これに伴い、既存の `new DenyIpsRepository(context.env.DB).isIpDenied(ip)` で判定している部分を IPv6 の64ビットでチェックするよう対応する
- 登録禁止ドメイン管理
  - [x] 一覧ページ : 新規追加と、登録済みのものの削除を可能にする
- [ ] 管理用の Services・Repositories を別クラスに分離する
  - `server/services/admin/`・`server/repositories/admin/` を用意し、`admin-example-repository.ts` などのように `admin-` をファイル名の Prefix にする。Class 名も `AdminExampleRepository` のように `Admin` を Prefix にする


## 機能改善

コード中に TODO コメントで入れてあるモノもあり。

- [ ] `?id=` や `?page=` パラメータを扱うページで、アドレスバーの URL に正しい値を反映したい
- [ ] `support.tsx` の `lookupSite` の要領で、サイト新規登録・サイト編集フォームにて `exactMatchId`・`nearMatchId` ヒット時にサイト名を表示したい
- [ ] 論理削除されたサイト ID が指定されたら `support.tsx` の表示をエラー扱いにしたい
- [ ] `support.tsx` で、論理削除されたサイト ID が紐付いている `posts` は何があっても非表示にしたい
  - [ ] 必要そうであれば、`posts.is_deleted` カラムを用意して、サイトの論理削除時にフラグを立てるようにする (リングマスター管理画面で復旧させた場合はフラグを戻す)


## サイト探索機能の追加

- [ ] サイト名、管理人名、説明文、URL を対象項目にした検索ページ : 結果一覧はページング機能付き
- [ ] タグ一覧を表示し、タグを押下するとタグが紐付いているサイトを列挙する : 結果一覧はページング機能付き
  - [ ] タグ一覧では `[タグ1 (15)]　[タグ2 (4)]` のように、タグに紐付いているサイト数をカッコで表示したい
  - [ ] タグ自体の検索を可能にする
