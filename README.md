# 個人サイトウェブリング Personal WebSite WebRing

<https://personal-website-webring.neos21.net>


## コンセプト

個人サイトを登録できるウェブリング。

- 主に日本語のサイトをターゲットとするが、外国語のサイトの登録を拒否したりはしない
- 各種 SNS (Twitter・Instagram 等) やレンタルブログプラットフォーム (note・Zenn・Qiita 等) の URL は登録不可とする
- ウェブリングのスニペットとして以下のリンクを提供する
    - `/prev?id=【ID】` : 指定のサイト ID の前のサイトに飛ぶ
    - `/next?id=【ID】` : 指定のサイト ID の次のサイトに飛ぶ
    - `/random?id=【ID】` : 指定のサイト ID を除外したどこかのサイトにランダムに飛ぶ
- サイトは「自薦登録」と「他薦登録」ができる
    - リングマスターによる承認フロー等はなし
    - 他薦登録済のサイトの管理人が現れた場合、「自薦」扱いに切り替えて登録データをマージ・編集可能とする
        - 管理人であるかどうかは性善説に基づく。なりすましが発生した場合はサポート掲示板にて手動対応する
- 登録されたサイトごとにコメントを残せる
- ウェブリングに関する問合せ等を受け付けるサポート掲示板を併設する
    - 任意でサイト ID を指定して、特定のサイトに関する問合せが区別できるようにする


## 機能詳細

- 技術スタック
    - Cloudflare Workers : 実行基盤
    - Cloudflare D1 Database : SQLite データベース
    - Cloudflare Turnstile : Bot 対策
    - Hono : サーバサイド
    - React Router : クライアントサイド
- サイトを他薦登録した場合、他薦ユーザによる編集・削除は不可とする
    - 自薦で新規登録した場合や、後から管理人が登場して自薦扱いに切り替えた場合は、管理人のみ編集・削除可能とする
- タグ管理方針
    - タグは任意入力可能な項目とする
    - 大文字小文字の差異は同一タグとみなし、表記は先勝ちで扱う
- 重複・類似 URL の取り扱い
    - 大文字小文字を区別せず完全一致の場合は登録不可とする
        - 例 : `https://example.com` と `https://Example.com` は同一とみなす
        - プロトコルの違い、`www.` の有無、末尾スラッシュや `/index.html` 等の有無は「完全一致」とはみなさない
    - URL を正規化して類似チェックを行う
        - `http://`・`https://` プロトコル、`www.`、`/index.html` 等、末尾の `/` を除去して、大文字小文字を区別せず扱う
        - ドメイン・パスに正規化して一致するサイトがある場合は、近い URL が登録済であることを表示するが登録は可能とする
        - 例 : `http://example.com`・`https://example.com/`・`https://www.Example.com/index.html` は「近い URL」とみなす
- サイトへのコメントは投稿のみ可、編集・削除は不可とする
- サポート掲示板は投稿のみ可、編集・削除は不可とする
- リングマスター向けの管理画面を `/admin` 配下に用意する。対応する API は `/api/admin` 配下に用意する


## テーブル定義

テーブル定義は以下に記載して管理するのみとし、Cloudflare D1 への適用は手動で行う。

```sql
CREATE TABLE sites (  -- サイト
  id               INTEGER  PRIMARY KEY  AUTOINCREMENT,                           -- ID
  is_self          INTEGER  NOT NULL     CHECK (is_self IN (0, 1)),               -- 他薦 `0` or 自薦 `1` (他薦登録された後に管理人が名乗り出た場合は自薦に切り替える)
  url              TEXT     NOT NULL     UNIQUE,                                  -- URL
  site_name        TEXT     NOT NULL,                                             -- サイト名
  owner_name       TEXT,                                                          -- 管理人名 (任意)
  description      TEXT,                                                          -- サイトの説明 (任意)
  banner_url       TEXT,                                                          -- バナー画像 URL (任意)
  banner_width     INTEGER,                                                       -- バナー画像の横幅ピクセル (バナー画像 URL を指定した場合は必須)
  banner_height    INTEGER,                                                       -- バナー画像の高さピクセル (バナー画像 URL を指定した場合は必須)
  password_hash    TEXT,                                                          -- 管理パスワード (自薦の場合のみ必須・他薦の場合は入力不可)
  created_at       TEXT     NOT NULL     DEFAULT CURRENT_TIMESTAMP,               -- 登録日時
  updated_at       TEXT     NOT NULL     DEFAULT CURRENT_TIMESTAMP,               -- 更新日時
  is_deleted       INTEGER  NOT NULL     CHECK (is_deleted IN (0, 1))  DEFAULT 0  -- 論理削除した場合は `1` (管理人による削除申告・リングマスターの判断で物理削除せず削除扱いにする場合)
);

CREATE TABLE tags (  -- タグ
  id    INTEGER  PRIMARY KEY  AUTOINCREMENT,  -- ID
  name  TEXT     NOT NULL     UNIQUE          -- タグ名
);

CREATE TABLE site_tags (  -- サイトに付与されたタグ
  site_id  INTEGER  NOT NULL  REFERENCES sites(id),  -- サイト ID (`sites.id`)
  tag_id   INTEGER  NOT NULL  REFERENCES tags(id),   -- タグ ID (`tags.id`)
  PRIMARY KEY (site_id, tag_id)
);

CREATE TABLE site_ips (  -- サイト登録・編集・削除時の IP アドレス履歴 (荒らし対策用)
  id          INTEGER  PRIMARY KEY  AUTOINCREMENT,                 -- ID
  site_id     INTEGER  NOT NULL     REFERENCES sites(id),          -- サイト ID (`sites.id`)
  is_created  INTEGER  NOT NULL     CHECK (is_created IN (0, 1)),  -- 新規登録時は `1`・編集と削除時は `0`
  is_self     INTEGER  NOT NULL     CHECK (is_self    IN (0, 1)),  -- 他薦 `0` or 自薦 `1`
  ip          TEXT     NOT NULL,                                   -- IP アドレス
  created_at  TEXT     NOT NULL     DEFAULT CURRENT_TIMESTAMP      -- 登録日時
);

CREATE TABLE site_comments (  -- サイトへのコメント
  id          INTEGER  PRIMARY KEY  AUTOINCREMENT,             -- ID
  site_id     INTEGER  NOT NULL     REFERENCES sites(id),      -- サイト ID (`sites.id`)
  user_name   TEXT,                                            -- ハンドルネーム (任意)
  content     TEXT     NOT NULL,                               -- 本文
  ip          TEXT     NOT NULL,                               -- IP アドレス (荒らし対策用)
  created_at  TEXT     NOT NULL     DEFAULT CURRENT_TIMESTAMP  -- 登録日時
);

CREATE TABLE posts (  -- サポート掲示板の投稿
  id          INTEGER  PRIMARY KEY  AUTOINCREMENT,                          -- ID
  site_id     INTEGER               REFERENCES sites(id),                   -- サイト ID (`sites.id`)・未指定の場合はサイトに紐付かない内容の問合せ
  user_name   TEXT,                                                         -- ハンドルネーム (任意)
  content     TEXT     NOT NULL,                                            -- 本文
  ip          TEXT     NOT NULL,                                            -- IP アドレス (荒らし対策用)
  is_admin    INTEGER  NOT NULL     CHECK (is_admin IN (0, 1))  DEFAULT 0,  -- リングマスターの投稿である場合は `1`
  created_at  TEXT     NOT NULL     DEFAULT CURRENT_TIMESTAMP               -- 登録日時
);

CREATE TABLE deny_ips (  -- 禁止 IP アドレス
  id          INTEGER  PRIMARY KEY  AUTOINCREMENT,             -- ID
  ip          TEXT     NOT NULL     UNIQUE,                    -- IP アドレス
  created_at  TEXT     NOT NULL     DEFAULT CURRENT_TIMESTAMP  -- 登録日時
);

CREATE TABLE deny_domains (  -- 禁止ドメイン
  id          INTEGER  PRIMARY KEY  AUTOINCREMENT,             -- ID
  domain      TEXT     NOT NULL     UNIQUE,                    -- ドメイン
  created_at  TEXT     NOT NULL     DEFAULT CURRENT_TIMESTAMP  -- 登録日時
);

CREATE TABLE counters (  -- カウンタ
  counter  INTEGER  PRIMARY KEY
);
INSERT INTO counters (counter) VALUES (0);
```


## 将来的にやりたいこと

- サイト名、管理人名、説明文、URL を対象項目にした検索ページ : 結果一覧はページング機能付き
- タグ一覧を表示し、タグを押下するとタグが紐付いているサイトを列挙する : 結果一覧はページング機能付き
    - タグ一覧では `[タグ1 (15)] [タグ2 (4)]` のように、タグに紐付いているサイト数をカッコで表示する
    - タグ自体の検索を可能にする
- アクセスログ
    - ページ遷移・フォーム操作ごとに IP アドレスや UA を記録し、アクセス数チェックや荒らし行為のログをリングマスターが確認できるようにしたい
    - `/prev`・`/next`・`/random` を踏んだ人の情報やリダイレクト先の情報などを控えておき、流量をリングマスターが確認できるようにしたい
- サイトの所有証明
    - `<meta name="personal-website-webring" content="【ID】">` を HTML 中に書いておく
    - DNS TXT レコードで `personal-website-webring=【ID】` を登録しておく
    - `/personal-website-webring.txt` を配置し、中に `【ID】` を記載しておく
    - サイトの編集画面で所有証明ができたら認証バッジを表示するような構想


## やらないこと

- メール認証全般
    - なりすましや荒らしが増えてきたら、メールアドレス・パスワードでのユーザ登録は検討するが、メール送信は実装が面倒なためやらない


-----


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
$ wrangler d1 execute personal-website-webring --local  --file='./schema.sql'
$ wrangler d1 execute personal-website-webring --remote --file='./schema.sql'

# インデックスを確認する
$ wrangler d1 execute personal-website-webring --local  --command='SELECT * FROM sqlite_master WHERE type = '\''index'\'''
$ wrangler d1 execute personal-website-webring --remote --command='SELECT * FROM sqlite_master WHERE type = '\''index'\'''
```


## シークレット

- ローカルでは `.dev.vars` ファイルを参照する (Git 管理対象外)
- `server/types/hono-bindings.ts` で型定義に含めておく

```bash
$ echo 'VALUE' | wrangler secret put 【Secret 名】 --name personal-website-webring

$ echo 'VALUE' | wrangler secret put TURNSTILE_SECRET_KEY --name personal-website-webring
$ echo 'VALUE' | wrangler secret put ADMIN_PASSWORD       --name personal-website-webring
$ echo 'VALUE' | wrangler secret put ADMIN_JWT_SECRET     --name personal-website-webring
```


## Links

- [Neo's World](https://neos21.net/)
