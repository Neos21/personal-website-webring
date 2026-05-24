# AGENTS.md


## 実装の流れ

- 1タスクごとに実装を行い開発者にレビューを求める
    - 開発者が全コードをレビューするので、各ステップでの変更量が大きくならないように事前にタスク分解すること
- 実装完了時は `$ npm run lint` と `$ npm run build` を実行してエラーがない状態にする
    - 3回以上修正して Lint・ビルドを実行しても修正しきれないエラーが残る場合は処理を中止し、開発者に報告する
- レビュー指摘を受けた場合は以下の「コーディングルール」セクションに自分で追記する
- Cloudflare D1 へのマイグレーション、Cloudflare Workers への本番デプロイは開発者が手動で行うため、AI エージェントが実行しないこと
- 実行できないコマンド等が発生したら処理を中止し、開発者に報告する


## コーディングルール

- 共有ロジックはヘルパーに切り出す
- DB テーブルの型定義は `shared/types/` 配下にテーブル別に作成する
- DB 操作部分は `server/repositories/` 配下にテーブル別の Repository として実装する
- サーバサイドロジックは `server/services/` 配下に作成し、サーバサイドロジック内でのみ使う型定義は `server/types/` 配下に作成する
- `context.req.json()` は常に `await context.req.json().catch(() => null)` で受け、`body == null` の場合は 400 エラーを返す
- 正常レスポンスは必ずトップレベルを `result` のみとし、エラーはトップレベル `error` を使う
- 正規表現をは必ず `(/.../)` で囲む
- 暗黙型変換を使った `if(!condition)` は避け、`== null` や `=== ''` のように明示比較する。`isEmpty()` 関数を積極的に利用する
- ルートパス文字列に `/:id` を含む場合、`comment-colon-spacing` ルールの影響を避けるため `// eslint-disable-line neos-eslint-plugin/comment-colon-spacing` を付ける
