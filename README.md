# Personal WebSite WebRing

<https://personal-website-webring.neos21.workers.dev>

## コンセプト

TODO


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
