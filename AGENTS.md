# AGENTS.md


## 実装の流れ

- `README.md` の `## コンセプト` セクションに記載の内容を実装していく
- 実装前にタスクを分析・分解し、`TASKS.md` にステップごとにチェックリスト形式で記載する
    - タスクの不明点があったら実装前に開発者にヒアリングする
    - `README.md` の `## コンセプト` セクション内の記載に不備があった場合は加筆修正する・それ以外のセクションは加筆修正してはいけない
- ステップごとに実装を行い、各ステップが完了したら処理を中止し、開発者にレビューを求める
    - 開発者が全コードをレビューするので、各ステップでの変更量が大きくならないように事前にタスク分解すること
    - 実装状況は `TASKS.md` の記載とチェックリストで管理し、チャットを切り替えたりしてもタスクを引き継げるようにしておくこと
- 実装完了時は `$ npm run lint` と `$ npm run build` を実行してエラーがない状態にする
    - 必要に応じて `// eslint-disable-line neos-eslint-plugin/comment-colon-spacing` と `// eslint-disable-line @typescript-eslint/no-explicit-any` による Lint 回避のみ許可する
    - 3回以上修正して Lint・ビルドを実行しても修正しきれないエラーが残る場合は処理を中止し、開発者に報告する
- 共有ロジックはヘルパーに切り出す。例 : `server/helpers/convert-to-integer.ts` を使って `convertToInteger` を共通化する
- `context.req.json()` は常に `await context.req.json().catch(() => null)` で受け、`body == null` の場合は 400 エラーを返す
- 正常レスポンスは必ずトップレベルを `result` のみとし、エラーはトップレベル `error` を使う
- `.replace()` に正規表現を渡すときは必ず `(/.../)` で囲む
- 暗黙型変換を使った `if(!x)` は避け、`== null` や `=== ''` のように明示比較する
- ルートパス文字列に `/:id` を含む場合、`comment-colon-spacing` ルールの影響を避けるため `// eslint-disable-line neos-eslint-plugin/comment-colon-spacing` を付ける
- Cloudflare D1 へのマイグレーション、Cloudflare Workers への本番デプロイは開発者が手動で行うため、AI エージェントが実行しないこと
- 実行できないコマンド等が発生したら処理を中止し、開発者に報告する
