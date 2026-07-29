# リリースガイド

このドキュメントは、本リポジトリ（`yuki-koma2/resume`）のリリースフローを **はじめて触る人でも一人で完結できるレベル** で解説するものです。  
履歴書本文の更新だけなら `main` に push すれば GitHub Pages に反映されますが、**配布用の PDF を更新するにはリリース作業が必要** です。本ドキュメントはその「リリース作業」に焦点を当てています。

---

## 1. CI/CD とは

「CI/CD」は **CI（Continuous Integration: 継続的インテグレーション）** と **CD（Continuous Delivery: 継続的デリバリ）** の総称で、コードを変更するたびに *自動で* テスト・ビルド・配布までを走らせる仕組みのことです。

- **CI（継続的インテグレーション）** … push や Pull Request のたびに、品質チェック（lint やテスト）を自動で走らせる。壊れた状態が `main` に混入することを防ぐ。
- **CD（継続的デリバリ）** … 一定の条件を満たしたタイミング（タグ作成、手動実行など）で、ビルドした成果物を配布物として公開する。

本リポジトリでは GitHub Actions を使い、以下 4 本のワークフローでこれを実現しています。

| ファイル | トリガー | 役割 | 区分 |
| -- | -- | -- | -- |
| `.github/workflows/ci.yaml` | `push` to `main` / `pull_request` | `npm run lint`（textlint）を実行 | CI |
| `.github/workflows/release.yaml` | `workflow_dispatch` | PDF をビルドし、Git タグ採番＆ GitHub Release を作成 | CD |
| `.github/workflows/npmVersionUp.yaml` | `workflow_dispatch` | `package.json` の `"version"` を `npm version` で更新 | 補助 |
| `.github/workflows/reminder.yaml` | `cron`（四半期） | 「履歴書を更新してね」という Issue を自動生成 | 通知 |

つまりこのリポジトリにおける CI/CD は、ざっくり次のように整理できます。

- **文章チェック（CI）** … push / PR のたびに自動で走る。意識する必要なし。
- **PDF 化と公開（CD）** … 人が GitHub の画面から手動で起動する（後述）。

---

## 2. バージョン番号の意味

本リポジトリのバージョンは **[セマンティック・バージョニング（semver）](https://semver.org/lang/ja/)** の `MAJOR.MINOR.PATCH` 形式（例: `2.0.4`）を使います。  
ただし扱っているのはソフトウェアではなく **履歴書** なので、各パートが指す内容を以下のように読み替えています。

| パート | semver 一般の意味 | このリポジトリでの意味 | 想定頻度 |
| -- | -- | -- | -- |
| `MAJOR` | 後方互換のない変更 | **キャリアの大きな変化**：転職、参画プロジェクトの追加、社内異動 | 年に 1 回程度 |
| `MINOR` | 後方互換のある機能追加 | **実績の追記**、四半期ごとの定期的な見直し | 四半期 |
| `PATCH` | バグ修正 | **誤字脱字** など軽微な修正 | 発見次第 |

迷ったときの判断基準は「**読み手の印象がどれくらい変わるか**」です。

- 役職や所属が変わった → `major`
- 担当業務や成果が増えた → `minor`
- typo を直しただけ → `patch`

ルートの [`README.md`](../../README.md#release) にも同じ表が要約として載っています。

---

## 3. リリース手順（通常運用）

### 3.1 前提条件

リリースを走らせる前に以下を満たしていることを確認してください。

- [ ] `docs/README.md`（履歴書本文）の更新が `main` にコミット／マージされている。
- [ ] CI（`ci.yaml`）が `main` で **緑（成功）** になっている。
- [ ] 必要に応じて、ローカルで `npm run build` を実行し `dist/resume.pdf` の見栄え（改ページ位置・フォント崩れ・PDF メタ情報）を目視確認している。

ローカル確認は必須ではありませんが、CI でビルドが通っても PDF レイアウトの崩れまでは検知できないため、推奨します。

### 3.2 リリースの実行（GitHub UI 操作）

1. リポジトリページで **Actions** タブを開く。
2. 左サイドバーから **`release and build pdf`** ワークフローを選択する。
3. 右側に表示される **Run workflow** プルダウンを開く。
4. **Use workflow from:** は `Branch: main` のまま。
5. **release size** で `patch` / `minor` / `major` のいずれかを選ぶ（基準は [§2](#2-バージョン番号の意味) を参照）。
6. **Run workflow** ボタンを押す。

実行が始まると、Actions の一覧に新しいラン（`release and build pdf`）が出現します。完了まで数分かかります。

### 3.3 ワークフローの内部で何が起きるか

`release.yaml` のジョブ `build` が以下のステップを順に実行します（`.github/workflows/release.yaml` 抜粋）。

1. **`actions/checkout@v7.0.1`** — リポジトリと全タグをチェックアウト。
2. **`actions/setup-node@v7.0.0` (Node.js 22)** — Node.js のセットアップ。
3. **`npm ci`** — ロックファイルどおりに依存をインストール。
4. **`npm run build`** — `md-to-pdf` が `docs/README.md` を読み込み、`config/md-to-pdf.config.json` の設定に従って `dist/resume.pdf` を生成。
5. **`mathieudutour/github-tag-action@v6.2`** — 直前のタグを起点に、`releaseSize` で指定したパートを 1 つ上げて新しい Git タグを作成（例: `v2.0.4` → `patch` で `v2.0.5`）。
6. **`softprops/action-gh-release@v3.0.2`** — そのタグに紐づく GitHub Release を作成し、`dist/resume.pdf` をアセットとして添付。リリースノートには `mathieudutour/github-tag-action` が生成した changelog（直前のタグからのコミットログ）が入る。

#### `mathieudutour/github-tag-action` の補足

このアクションには「コミットメッセージのプレフィックス（`feat:` / `fix:` / `BREAKING CHANGE:` など、いわゆる Conventional Commits）からバージョン上げ幅を自動判定する」機能があり、`default_bump` は **その判定ができなかった場合のフォールバック** として使われます。  
本リポジトリでは Conventional Commits を強制していないため、通常は手動で選んだ `releaseSize` がそのまま採用されますが、コミットに `feat:` などが混じっているとそちらが優先されることがある点だけ覚えておいてください。

### 3.4 完了確認

ワークフローが完了したら、以下を順に確認します。

1. **Actions タブ** で対象のランが緑（success）になっていること。失敗していたら [§6 トラブルシューティング](#6-トラブルシューティング) を参照。
2. リポジトリトップ → **Releases** に新しいリリース（例: `Release v2.0.5`）が追加されていること。
3. リリース内の **Assets** に `resume.pdf` が添付されていること。クリックしてダウンロードし、内容を目視確認する。
4. README に貼られている [PDF ダウンロードリンク](https://github.com/yuki-koma2/resume/releases) を踏んで、最新リリースが期待どおり並んでいることを確認する。

---

## 4. `package.json` の `"version"` の扱い

本リポジトリでは Git タグ／GitHub Release のバージョンと、`package.json` の `"version"` フィールドを **別の経路で管理しています**。混同しないように注意してください。

| 対象 | 更新する仕組み |
| -- | -- |
| Git タグ・GitHub Release | `release.yaml` の `mathieudutour/github-tag-action` が自動採番 |
| `package.json` の `"version"` | `npmVersionUp.yaml` を `workflow_dispatch` で手動実行（`npm version <size>` を流す） |

PDF の入手は GitHub Releases から行うため、配布物の観点では `package.json` の値がズレていても致命的ではありません。  
ただし npm のバージョン慣習に揃えたい場合は、`release.yaml` を起動した直後に `npmVersionUp.yaml` を **同じ `releaseSize`** で起動して同期させてください。

---

## 5. ローカルでの動作確認（任意）

リリースを走らせる前に、手元で同じビルドを再現できます。

```shell
$ npm ci
$ npm run lint     # textlint（CI と同じチェック）
$ npm run test     # jest（現時点ではプレースホルダ）
$ npm run build    # md-to-pdf → dist/resume.pdf を生成
```

`dist/resume.pdf` を開き、以下を確認します。

- 改ページ位置がおかしくないか（章の途中で切れていないか）。
- 日本語フォントが崩れていないか（豆腐 `□` になっていないか）。
- ヘッダー／フッター（ページ番号）が想定どおりに出ているか。

`dist/resume.pdf` は `.gitignore` 対象なので、確認後にコミットする必要はありません。

---

## 6. トラブルシューティング

| 症状 | 原因の典型例と対処 |
| -- | -- |
| `npm run lint` が CI で落ちる | `dictionary/prh_ubiquitous.yml`（ユビキタス言語）や `dictionary/typo.yml`（誤字）の校正ルールに当たっている可能性が高い。`npm run lint:fix` を試して差分を確認するか、エラーメッセージ中の `prh:` 行を見て該当語を直す。 |
| `npm run build` が落ちる | `md-to-pdf` は内部で Chromium を起動する。Node 22 系を使っているか（`.node-version`）、`node_modules` が壊れていないか（依存を削除して `npm ci` し直す）を確認。 |
| Release は作成されたが `resume.pdf` が添付されていない | `softprops/action-gh-release` ステップのログで `./dist/resume.pdf` が見つからない／空、というエラーが出ていないか確認。直前の `npm run build` ステップが失敗・スキップしている場合がある。 |
| 想定と違うバージョンでタグが切られた | コミットに `feat:` / `fix:` / `BREAKING CHANGE:` などのプレフィックスが混じっていて、`mathieudutour/github-tag-action` の自動判定が `releaseSize` より優先された可能性。Releases から該当リリースを削除し、Git タグも削除した上で再実行する（タグ削除は破壊的なので慎重に）。 |
| `release.yaml` を自動実行したい | 現在は誤リリースを避けるため `workflow_dispatch` のみで起動する。自動化する場合は、タグ・Release の作成条件と重複実行時の扱いを決めてからトリガーを追加する。 |

---

## 7. 関連ドキュメント

- ルート [`README.md`](../../README.md) — プロジェクト概要・ディレクトリ構成・リリース粒度の表。
- [`CLAUDE.md`](../../CLAUDE.md) — Claude Code が本リポジトリで作業するときの前提情報。
- [`docs/README.md`](../README.md) — 履歴書本文（リリースの対象になるファイル）。
- 参考: [GitHubの機能をフルに使って職務経歴書の継続的インテグレーションを実現する](https://zenn.dev/ryo_kawamata/articles/resume-on-github)
