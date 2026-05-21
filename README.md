# Personal WebSite WebRing

<https://personal-website-webring.neos21.workers.dev>

## コンセプト

- 個人サイトを登録できるウェブリング
    - 主に日本語のサイトをターゲットとするが、外国語のサイトの登録を拒否したりはしない
    - 各種 SNS (Twitter・Instagram 等) やレンタルブログプラットフォーム (note・Zenn・Qiita 等) の URL は登録不可とする
- 技術スタック
    - Cloudflare Workers : 実行基盤
    - Cloudflare D1 Database : SQLite データベース
    - Cloudflare Turnstile : Bot 対策
    - Hono : サーバサイド
    - React Router v7 : クライアントサイド
- ウェブリングのスニペットとして以下のリンクを提供する
    - `/prev?id=【ID】` : 指定のサイト ID の前のサイトに飛ぶ
    - `/next?id=【ID】` : 指定のサイト ID の次のサイトに飛ぶ
    - `/random?id=【ID】` : 指定のサイト ID を除外したどこかのサイトにランダムに飛ぶ
- サイトは「自薦登録」と「他薦登録」ができる
    - リングマスターによる承認フロー等はなし
    - 他薦登録済のサイトについて、そのサイトの管理人が現れた場合、「自薦登録」に切り替えて登録データをマージ・編集可能とする
- 登録されたサイトごとにコメントを残せる (はてなブックマークのコメント的な機能)
- ウェブリングに関する問合せ等を受け付けるサポート掲示板を併設する
    - 任意でサイト ID を指定して、特定のサイトに関する問合せが区別できるようにする (なりすましの自薦登録等)

### 画面一覧

| パス       | TSX ファイルパス                     | 画面名           | 備考                                                                                                                  |
|------------|--------------------------------------|------------------|-----------------------------------------------------------------------------------------------------------------------|
| `/`        | `./client/pages/index/index.tsx`     | トップページ     | ウェブリングの概要・登録フォームへのリンク・登録済サイト一覧へのリンクなど                                            |
| `/new`     | `./client/pages/new/new.tsx`         | 新規登録         | 他薦・自薦を選択して新規サイトを登録できるフォーム                                                                    |
| `/list`    | `./client/pages/list/list.tsx`       | 登録済サイト一覧 | 登録日時が新しいモノから順に一覧表示する・100件ずつ程度でページングする                                               |
| `/site`    | `./client/pages/site/site.tsx`       | サイト詳細       | `?id=【ID】` で指定されたサイトの詳細・コメント一覧・コメント投稿フォーム・当該サイトに関するサポート掲示板へのリンク |
| `/edit`    | `./client/pages/edit/edit.tsx`       | 編集・削除       | `?id=【ID】` で指定されたサイトの編集・削除フォーム (自薦登録のみ編集・削除可能)                                      |
| `/support` | `./client/pages/support/support.tsx` | サポート掲示板   | サポート掲示板の投稿一覧・投稿フォーム。`/site` からの遷移時は `/support?id=【ID】` でサイトを指定できるようにする    |

- リングマスターによる管理画面は `/admin` 配下 (`./client/pages/admin/` 配下) に別途用意する

### API 一覧

| パス                         | メソッド | TS ファイルパス                                  | API 概要                                                                                      |
|------------------------------|----------|--------------------------------------------------|-----------------------------------------------------------------------------------------------|
| `/prev`                      | GET      | `./server/routes/prev/prev.ts`                   | スニペットからのリンクとして `?id=【ID】` を起点とした「前のサイト」の URL にリダイレクトする |
| `/next`                      | GET      | `./server/routes/next/next.ts`                   | スニペットからのリンクとして `?id=【ID】` を起点とした「次のサイト」の URL にリダイレクトする |
| `/random`                    | GET      | `./server/routes/random/random.ts`               | スニペットからのリンクとして `?id=【ID】` を除外したランダムなサイトの URL にリダイレクトする |
| `/api/sites`                 | POST     | `./server/routes/api/sites/sites.ts`             | 新規登録                                                                                      |
| `/api/sites`                 | GET      | `./server/routes/api/sites/sites.ts`             | 登録済サイト一覧 (ページング機能付き)                                                         |
| `/api/sites/【ID】`          | PUT      | `./server/routes/api/sites/sites.ts`             | 管理人による編集                                                                              |
| `/api/sites/【ID】`          | DELETE   | `./server/routes/api/sites/sites.ts`             | 管理人による削除 (論理削除)                                                                   |
| `/api/sites/【ID】`          | GET      | `./server/routes/api/sites/sites.ts`             | サイト詳細                                                                                    |
| `/api/sites/【ID】/comments` | GET      | `./server/routes/api/sites/comments/comments.ts` | サイトのコメント一覧                                                                          |
| `/api/sites/【ID】/comments` | POST     | `./server/routes/api/sites/comments/comments.ts` | サイトへのコメント投稿                                                                        |
| `/api/posts`                 | GET      | `./server/routes/api/posts/posts.ts`             | サポート掲示板の投稿一覧 (ページング機能付き)・`?id=【ID】` で指定サイトに関する投稿のみ一覧  |
| `/api/posts`                 | POST     | `./server/routes/api/posts/posts.ts`             | サポート掲示板に投稿する                                                                      |

- リングマスターによる管理画面向けの API は `/api/admin` 配下 (`./server/routes/api/admin/` 配下) に別途用意する

### テーブル定義

- テーブル定義は以下に記載して管理するのみとし、Cloudflare D1 への適用は手動で行う

```sql
-- サイト
CREATE TABLE sites (
  id               INTEGER  PRIMARY KEY  AUTOINCREMENT,                         -- ID
  is_self          INTEGER  NOT NULL     CHECK (is_self IN 0, 1),               -- 他薦 `0` or 自薦 `1` (他薦登録された後に管理人が名乗り出た場合は自薦に切り替える)
  url              TEXT     NOT NULL     UNIQUE,                                -- URL
  site_name        TEXT     NOT NULL,                                           -- サイト名
  owner_name       TEXT,                                                        -- 管理人名 (任意)
  description      TEXT,                                                        -- サイトの説明 (任意)
  banner_url       TEXT,                                                        -- バナー画像 URL (任意)
  banner_width     INTEGER,                                                     -- バナー画像の横幅ピクセル (バナー画像 URL を指定した場合は必須)
  banner_height    INTEGER,                                                     -- バナー画像の高さピクセル (バナー画像 URL を指定した場合は必須)
  password_hash    TEXT,                                                        -- 管理パスワード (自薦の場合のみ必須・他薦の場合は入力不可)
  created_at       TEXT     NOT NULL     DEFAULT CURRENT_TIMESTAMP,             -- 登録日時
  updated_at       TEXT     NOT NULL     DEFAULT CURRENT_TIMESTAMP,             -- 更新日時
  is_deleted       INTEGER  NOT NULL     CHECK (is_deleted IN 0, 1)  DEFAULT 0  -- 論理削除した場合は `1` (管理人による削除申告・リングマスターの判断で物理削除せず削除扱いにする場合)
);

-- タグ
CREATE TABLE tags (
  id    INTEGER  PRIMARY KEY  AUTOINCREMENT,  -- ID
  name  TEXT     NOT NULL     UNIQUE          -- タグ名
);

-- サイトに付与されたタグ
CREATE TABLE site_tags (
  site_id  INTEGER  NOT NULL  REFERENCES sites(id),  -- サイト ID (`sites.id`)
  tag_id   INTEGER  NOT NULL  REFERENCES tags(id),   -- タグ ID (`tags.id`)
  PRIMARY KEY (site_id, tag_id)
);

-- サイト登録・更新時の IP アドレス (荒らし対策用)
CREATE TABLE site_ips (
  id          INTEGER  PRIMARY KEY  AUTOINCREMENT,               -- ID
  site_id     INTEGER  NOT NULL     REFERENCES sites(id),        -- サイト ID (`sites.id`)
  is_created  INTEGER  NOT NULL     CHECK (is_created IN 0, 1),  -- 新規登録時は `1`・編集と削除時は `0`
  is_self     INTEGER  NOT NULL     CHECK (is_self IN 0, 1),     -- 他薦 `0` or 自薦 `1`
  ip          TEXT     NOT NULL,                                 -- IP アドレス
  created_at  TEXT     NOT NULL     DEFAULT CURRENT_TIMESTAMP    -- 登録日時
);

-- サイトへのコメント
CREATE TABLE site_comments (
  id          INTEGER  PRIMARY KEY  AUTOINCREMENT,             -- ID
  site_id     INTEGER  NOT NULL     REFERENCES sites(id),      -- サイト ID (`sites.id`)
  user_name   TEXT,                                            -- ハンドルネーム (任意)
  content     TEXT     NOT NULL,                               -- 本文
  ip          TEXT     NOT NULL,                               -- IP アドレス (荒らし対策用)
  created_at  TEXT     NOT NULL     DEFAULT CURRENT_TIMESTAMP  -- 登録日時
);

-- サポート掲示板の投稿
CREATE TABLE posts (
  id          INTEGER  PRIMARY KEY  AUTOINCREMENT,                          -- ID
  site_id     INTEGER               REFERENCES sites(id),                   -- サイト ID (`sites.id`)・未指定の場合はサイトに紐付かない内容の問合せ
  user_name   TEXT,                                                         -- ハンドルネーム (任意)
  content     TEXT     NOT NULL,                                            -- 本文
  ip          TEXT     NOT NULL,                                            -- IP アドレス (荒らし対策用)
  is_admin    INTEGER  NOT NULL     CHECK (is_admin IN (0, 1))  DEFAULT 0,  -- リングマスターの投稿である場合は `1`
  created_at  TEXT     NOT NULL     DEFAULT CURRENT_TIMESTAMP               -- 登録日時
);
```

### 機能詳細

- サイト登録フォーム
    - 最初に「他薦」「自薦」を選ぶラジオボタンを用意しておき、選択に応じて以降のフォームの表示を切り替える。デフォルトは「他薦」を選択状態にしておく
    - 他薦の場合のフォーム項目
        - サイト名 (上限100文字)
        - URL (上限500文字)
        - 管理人名 (任意・上限50文字)
        - 説明文 (任意・上限500文字・改行可能)
        - タグ (1～10個・1つのタグ名は上限50文字)
        - バナー URL (任意・上限500文字)
        - バナーサイズ (200x40 と 88x31 をラジオボタンで選択式にする・デフォルトは 200x40 を選択状態にしておく)
        - 推薦者ハンドルネーム (任意・上限50文字)
        - 推薦コメント (必須・上限500文字・改行可能)
            - 「推薦者ハンドルネーム」と「推薦コメント」はサイトごとのコメント (`site_comments`) の「1コメ」として投稿する
        - Turnstile 認証ウィジェット
    - 自薦の場合のフォーム項目
        - サイト名
        - URL
        - 管理人名 (任意)
        - 説明文 (任意)
        - タグ (1～10個)
        - バナー URL (任意)
        - バナーサイズ (200x40 と 88x31 をラジオボタンで選択式にする・デフォルトは 200x40 を選択状態にしておく)
        - 管理パスワード (必須・上限128文字)
        - Turnstile 認証ウィジェット
    - 「タグ」は任意入力可能な項目とする。大文字小文字を区別せず既存の登録値と比較して `tags.name` をユニークに維持する
        - 例 : サイト A が「Game」タグを付与して登録済の状態で、サイト B が「game」というタグを入力した場合、自動的に登録済みのタグ「Game」へと表記を修正して登録する
    - 「URL」は適宜正規化して重複チェックを行う
        - 大文字小文字を区別せず完全一致の場合は「この URL は既に登録されています : ID [2]」のように表示して登録不可にする
            - 例 : `https://example.com` と `https://Example.com` は同一とみなす
        - `http://`・`https://` プロトコルを除去、`www` や `/index.html` や末尾 `/` は除去したドメイン・パスで一致するサイトがある場合は「近い URL が登録済みです : ID[2]」のように表示するが、完全一致でなければ登録可能とする
            - 例 : `http://example.com`・`https://example.com/`・`https://www.Example.com/index.html` は「近い URL」とみなせるようにチェックする
    - 他薦の場合、登録後の編集・削除は不可能。管理人を自称する人が現れた場合のみ、編集フォームから「自薦」扱いに切り替えて「管理パスワード」を設定して編集可能とする
- サイト詳細ページ
    - 他薦サイトの場合
        - 「このサイトの管理人ですか？」リンクを表示する → 編集・削除ページに遷移し、「自薦」扱いに切り替えて編集可能にするフォームを表示する
            - 編集フォーム項目 : 「自薦の場合のサイト登録フォーム項目」と同じ。管理パスワードを設定してもらうことで「自薦」扱いに切り替わる
            - 管理人であるかどうかは性善説に則り、「自称管理人」が名乗り出たらそれを優先する。もしなりすましが発生した場合はサポート掲示板にて手動対応する
    - 自薦サイトの場合
        - 「管理人様用 : 編集・削除」リンクを表示する → 編集・削除ページに遷移し、編集フォームと削除フォームを表示する
            - 編集フォーム項目 : 「自薦の場合のサイト登録フォーム項目」と同じ。管理パスワードを正しく入力してもらうことで管理人認証を行い編集する
            - 削除フォーム項目 : 「管理パスワード」を正しく入力してもらい「削除」ボタンを押すと、管理人認証を行い論理削除する
    - サイトへのコメントは投稿のみ可能。投稿後の編集・削除は不可能
        - ハンドルネーム (任意・上限50文字)
        - コメント (必須・上限500文字・改行可能)
- サポート掲示板
    - 投稿フォームの項目
        - ハンドルネーム (任意・上限100文字)
        - サイト ID (任意・指定した場合は「そのサイトに関連した問合せ」として区別するため使用する・未指定の場合は「ウェブリング全体に関する問合せ」として判断する)
        - 本文 (必須・上限500文字・改行可能)
        - Turnstile 認証ウィジェット
    - 投稿後の編集・削除は不可能
- リングマスターによる管理画面
    - `/admin` にパスワード入力欄と Turnstile 認証ウィジェットを設置する。POST `/api/admin/login` でログイン認証し、成功すれば `/admin/dashboard` に遷移する
    - `/admin/sites` でサイト一覧を表示する
    - `/admin/sites/【ID】` でサイトの編集・論理削除・物理削除を可能にする
    - `/admin/tags` でタグ一覧を表示する。タグ名の編集を可能にする。似たようなタグ名が重複している場合のためにタグを物理削除できるようにする
    - `/admin/support` でサポート掲示板の投稿一覧を表示する。リングマスターとしての投稿フォームを用意する
    - `/admin/deny-ips` で IP 制限をできるようにする。ココに追加された IP はサイト登録・編集、コメント、サポート掲示板への投稿等をできないようにする

### 将来的にやりたいこと (今はやらない)

- アクセスログ
    - ページ遷移・フォーム操作ごとに IP や UA を記録し、アクセス数チェックや荒らし行為のログをリングマスターが確認できるようにしたい
    - `/prev`・`/next`・`/random` を踏んだ人の情報やリダイレクト先の情報などを控えておき、流量をリングマスターが確認できるようにしたい
- サイトの所有証明
    - `<meta name="personal-website-webring" content="【ID】">` を HTML 中に書いておく
    - DNS TXT レコードで `personal-website-webring=【ID】` を登録しておく
    - `/personal-website-webring.txt` を配置し、中に `【ID】` を記載しておく
    - サイトの編集画面で所有証明ができたら認証バッジを表示するような構想

### やらないこと

- メール認証全般
    - なりすましや荒らしが増えてきたら、メールアドレス・パスワードでのユーザ登録は検討する


## npm Scripts

- `$ npm run dev`
    - `@react-router/dev` 内の React Router CLI を使用して Vite による開発サーバを起動する・`isbot` パッケージが勝手にインストールされる
- `$ npm run lint`
    - ESLint を実行して自動修正を行う
- `$ npm run generate-types`
    - Wrangler CLI を使用して `.dev.vars` を参照しつつ Workers が使用する型定義ファイルを `worker-configuration.d.ts` に出力する・React Router CLI を使用して `.react-router/` 型定義を出力する
- `$ npm run build`
    - React Router CLI が Vite を使用して本番ビルドする
- `$ npm run build-only`
    - `npm run build` が `npm run generate-types` と `tsc` の後に実際のビルドを行うのに対して、本コマンドは `react-router build` コマンドのみを実行する
- `$ npm run preview`
    - Vite ビルド後に Wrangler の開発サーバを起動する
- `$ npm run preview-only`
    - ビルド処理をスキップして Wrangler の開発サーバを起動する
- `$ npm run deploy`
    - Vite ビルド後に Cloudflare Workers にデプロイする
- `$ npm run deploy-only`
    - ビルド処理をスキップして Cloudflare Workers にデプロイする
- `$ npm run tsc`
    - TypeScript コンパイルチェックを行う
- `$ npm run wrangler`
    - Wrangler CLI


## D1 SQLite データベース

```bash
$ wrangler d1 create personal-website-webring

# テーブルを確認する
$ wrangler d1 execute personal-website-webring --local  --command='SELECT * FROM 【テーブル名】'
$ wrangler d1 execute personal-website-webring --remote --command='SELECT * FROM 【テーブル名】'

# SQL ファイルを実行する場合
# $ wrangler d1 execute personal-website-webring --local  --file='./schema.sql'
# $ wrangler d1 execute personal-website-webring --remote --file='./schema.sql'

# インデックスを確認する
$ wrangler d1 execute personal-website-webring --local  --command='SELECT * FROM sqlite_master WHERE type = '\''index'\'''
$ wrangler d1 execute personal-website-webring --remote --command='SELECT * FROM sqlite_master WHERE type = '\''index'\'''
```


## シークレット

- ローカルでは `.dev.vars` ファイルを参照する (Git 管理対象外)
- `server/types/hono-bindings.ts` で型定義に含めておく

```bash
$ echo 'VALUE' | wrangler secret put 【Secret 名】 --name personal-website-webring
```


## Links

- [Neo's World](https://neos21.net/)
