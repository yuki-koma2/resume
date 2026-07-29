# AGENT.md

このファイルは、このリポジトリで作業する AI エージェント向けのガイドです。`CLAUDE.md` の内容を元に、ツール非依存の作業指針としてまとめています。

## このリポジトリについて

このリポジトリは `yuki-koma2` の日本語職務経歴書を管理する public repository です。職務経歴書の本文は `docs/README.md` が唯一の一次ソースであり、lint、GitHub Pages、PDF ビルドの対象もこのファイルです。

Node.js のバージョンは `.node-version` で `19.2.0` に固定されています。

## 主要ファイルとディレクトリ

- `docs/README.md`: 職務経歴書の本体。PDF / GitHub Pages の元データ。
- `docs/README_en.md`: 英語版レジュメ。短いサマリ用途も含む。
- `docs/development/`: 正式ドキュメント。リリース手順・運用規約など、新規メンテナ向けの情報。
- `task_memory/YYYYMMDD/<project_name>/`: 作業過程の記録、一時的な調査結果、素材置き場。`.gitignore` 対象であり、コミット禁止。
- `dictionary/`: textlint / prh 用の辞書。
- `config/`: PDF ビルド設定。
- `scripts/`: フックや補助スクリプト。

## ドキュメント分類

- 正式な運用手順や新規メンテナが読むべき内容は `docs/development/` に置く。
- 作業中の調査メモ、素材、差分レポートは `task_memory/YYYYMMDD/<project_name>/` に置く。
- 短期の調査ログは `task_memory/YYYYMMDD/<project_name>/work_log/` のように専用ディレクトリを切って整理する。

## 機密性ポリシー

このリポジトリは public です。一方で `task_memory/` 配下には、レジュメ更新作業の素材として、社内ドキュメント・MCP・本人ヒアリング由来の公開不可情報が混入し得ます。

以下の情報は公開ファイルへそのまま転記してはいけません。

- 顧客名、病院名など、特定顧客を識別できる固有名詞。
- 特定顧客と紐づいた業務エピソード。
- 内部 KPI、SLO、運用実数などの生の数値。
- 社内プロダクトコードネーム、内部ドメインモデル名。
- 退職者の特定可能な経緯、組織判断の生記述。
- 協業者の個人名、内部の人事・採用情報。

`task_memory/` はローカル作業領域として扱い、絶対にコミットしないでください。`docs/README.md` など公開ファイルへ転記する際は、必ず抽象化・匿名化を行います。

### 公開ファイルへ転記する際のルール

- 顧客名・病院名は固有名詞を出さず、規模を概数で表す。
  - 例: 「急性期病院 約10施設」「慢性期病院 数施設」
- 数値 KPI は、公開して問題ない粒度まで丸めた概数で書く。
  - 例: 「処理対象 約2,500件」「ヒアリング件数 約10件」「月次リリース 1〜2本」
- 内部プロダクト構造を推測できる粒度の数値は、概数でも避ける。
  - 例: 「Vue 175ファイル / TS 687ファイル / テスト 342件」ではなく「主要 SPA の4桁規模ファイル群」
- 内部コードネーム・プロダクト名は「自社の管理画面」「自社の主要 SPA」などに丸める。
- 個人名は、協業者・退職者を問わず役割名で表現する。
  - 例: CEO、PO、デザイナー、開発チーム、前任の CTO
- `task_memory/` から `docs/` へ転記する前に、上記項目が混入していないか確認する。

## 機械的ガード

機密情報の流出を防ぐため、次のガードが用意されています。

### `task_memory/` のコミット禁止

- `.gitignore` で `/task_memory/` を除外している。
- `scripts/hooks/pre-commit` が `task_memory/` のステージングを reject する。
- `.github/workflows/ci.yaml` の `guard-task-memory` ジョブが、PR / push の差分に `task_memory/` が含まれていれば fail する。

### ローカル限定の禁止語検知

禁止語リスト自体も public repo に置けないため、検知用辞書はローカル限定です。

- `dictionary/prh_secrets.yml`: 病院名・個人名・社内コードネームなどを書く。`.gitignore` 対象。
- `dictionary/prh_secrets.yml.example`: ローカル辞書作成用テンプレート。
- `.textlintrc.local.json`: ローカル限定辞書を参照する textlint 設定。
- `npm run lint:secrets`: `docs/README.md` を禁止語検査する。

`dictionary/prh_secrets.yml` が無い場合、`lint:secrets` は fail します。新環境では必ず作成してください。

## 新環境セットアップ

```shell
npm install
cp dictionary/prh_secrets.yml.example dictionary/prh_secrets.yml
npm run setup:hooks
```

`dictionary/prh_secrets.yml` には、顧客名・個人名・社内コードネームなど、公開ファイルに混入させたくない語を追記します。

## レジュメ更新ワークフロー

- 真実は `docs/README.md`。
- 対外的なポートフォリオ情報は LAPRAS にも分散しており、`docs/README.md` と乖離しやすい。
- 大幅更新、たとえば転職・新プロジェクト・ロール変更の前には、LAPRAS 側の情報を確認し、差分レポートを `task_memory/YYYYMMDD/resume_update/` に残してから本文を編集する。
- 現状 `docs/README.md` は詳細版の職務経歴書。短縮版を作る場合も、この一次ソースから抽出する。
- 公開用に編集する際は、読み手に伝わる成果・役割・技術判断へ抽象化し、内部事情の生記述を避ける。

## よく使うコマンド

必ず `package.json` の npm scripts を通して実行してください。CI と同じ入口を使うことで、フラグや作業ディレクトリのずれを避けます。

```shell
npm install
npm run lint
npm run lint:fix
npm run lint:secrets
npm test
npm run build
npm run setup:hooks
```

単一テストを実行する場合:

```shell
npm test -- <path-or-name-pattern>
```

例:

```shell
npm test -- dictionary
```

`npx jest` や `npx textlint` の直接実行は避けてください。

## lint 構成

`.textlintrc.json` は、日本語文章向けのルールセットと `prh` 辞書を組み合わせています。

- `dictionary/prh.yml`: 辞書のエントリポイント。
- `dictionary/prh_ubiquitous.yml`: ユビキタス言語の統一。
- `dictionary/typo.yml`: typo 修正。

用語を標準化したい場合は、textlint 設定ではなく辞書 YAML を編集します。

`dictionary/__tests__/ubiquitous.test.ts` のカスタム辞書テストは現在 `it.skip` されています。これは既知の制約であり、単体では regression と扱わないでください。

## PDF ビルド

`config/md-to-pdf.config.json` が PDF 出力を制御します。

- A4
- 余白 30mm / 20mm
- フッターのページ番号
- monokai のコードハイライト
- スタイルは `config/md-to-pdf.css`

出力先は `dist/resume.pdf` です。

## リリースフロー

リリースは `.github/workflows/release.yaml` で管理されています。`workflow_dispatch` の `releaseSize` 入力により、`major` / `minor` / `patch` を選びます。

ワークフローの流れ:

1. `npm run build` で `dist/resume.pdf` を生成する。
2. `mathieudutour/github-tag-action` が指定サイズで tag を更新する。
3. GitHub Release を作成し、`dist/resume.pdf` を `resume.pdf` としてアップロードする。

バージョニング方針:

| size  | 用途 | 目安 |
| ----- | ---- | ---- |
| major | 転職、新プロジェクト、ロール変更 | 年次 |
| minor | 新しい実績、定期見直し | 四半期 |
| patch | typo 修正 | 随時 |

`.github/workflows/reminder.yaml` は、四半期ごとにレジュメ更新 issue を作成します。

## テスト方針

Jest は `jest.config.js` で設定されています。`collectCoverage: true` と v8 coverage が有効なため、ローカル実行後に `coverage/` が生成されます。

`__test__/sample.test.ts` はプレースホルダーです。実質的なテストは `dictionary/__tests__/` にあります、または今後追加されます。

## TDD 方針

このリポジトリでは t-wada スタイルの TDD を採用します。

1. Red: 小さく焦点の合った失敗するテストを書く。
2. Green: テストを通すために必要最小限の実装を行う。
3. Refactor: 外部挙動を変えずに設計・可読性・保守性を改善する。

開発時の原則:

- 本番コードを書く前にテストを書く。
- 小さな単位で進める。
- 1 つのテストは 1 つの責務・挙動に集中させる。
- リファクタリング中もテストを green に保つ。
- テストを仕様のドキュメントとして扱う。

## 作業時の注意

- 公開ファイルを編集する場合は、機密性ポリシーに照らして表現を確認する。
- `task_memory/` は読んでもよいが、内容をそのまま公開ファイルへ転記しない。
- `task_memory/` を stage / commit しない。
- 既存の npm scripts を使って lint / test / build を実行する。
- 関係のないファイルの整形やリファクタリングは避ける。
- 職務経歴書本文の編集では、事実性・読みやすさ・公開可能性を優先する。
