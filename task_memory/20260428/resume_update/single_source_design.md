# 単一ソース化（YAML → 複数 Markdown 生成）設計案

- 作成日: 2026-04-28
- 関連: [diff_report.md §7](./diff_report.md#7-長短2バージョンの設計q3--将来タスク) の **C 案** を具体化したもの
- 関連: [last_year_braindump.md §3](./last_year_braindump.md#3-並行期間の整理2026-05-以降) の並行期間表現を構造化する手段
- ステータス: **設計確定（Phase 1 着手待ち）**

---

## 0.5. 決定事項（2026-04-28 確定）

§10 の論点はすべて回答済み。以下の決定が後段の章を上書きする。

| # | 論点 | 決定 |
|---|------|------|
| 1 | データ形式 | **YAML** |
| 2 | variants 切り分け方式 | **A. 明示タグ式**（各エントリに `variants: [long, short]`） |
| 3 | 生成物のコミット | **コミットする**（CI で `git diff --exit-code` チェック）|
| 4 | 短縮版ファイル名 | **`docs/README_summary.md`** |
| 5 | 英語版 | **既存 `docs/README_en.md` を変換対象にする**（生成物に置き換え） |
| 6 | 起業会社名 | **プレースホルダ** で進める（例: `株式会社[未定]` / `id: own-company`） |
| 7 | `career_intent` の置き場 | **別ファイル `data/career_intent.yml`** に分離 |
| 8 | 「やめる」ガードレール | **設けない**。ただし下記「並行運用」を採用 |

### 8b. 並行運用方針（重要）

既存の手書き `docs/README.md` は **削除せず別名で残す**。新システムは別ファイル名に出力し、しばらく **2 系統並行**で運用する。

- 既存手書き版: `docs/README.md` を **触らずそのまま維持**（既存の `npm run lint` / `npm run build` / GitHub Pages はこちらを参照し続ける）
- 生成物: 当面は **別ファイル名**に出力する
  - `docs/README_generated.md` ← 長尺・生成版（将来的に `README.md` を置き換える候補）
  - `docs/README_summary.md` ← 短縮・生成版（新規）
  - `docs/README_en.md` ← 英語版は既存ファイルを置き換える形になるが、Phase 6 までは触らない

→ Phase 2 で `docs/README_generated.md` と既存 `docs/README.md` の差分を見ながら検証し、十分な信頼が得られたタイミングで以下のスワップを行う：

```
docs/README.md           → docs/README_legacy.md  （凍結保管）
docs/README_generated.md → docs/README.md         （以降は生成物が本流）
```

スワップのタイミングは別途判断（このドキュメントでは決め打ちしない）。

---

## 0. やりたいこと（ゴール）

職務経歴書の **データ（事実・記述）** と **見せ方（フォーマット・粒度・順序）** を分離し、1 つの一次ソースから以下を機械生成する。

- `docs/README.md` … 長尺・詳細版（既存ファイル、PDF/GitHub Pages の元）
- `docs/README_summary.md` … 短尺・要約版（カジュアル面談用、新規）
- 将来的に `docs/README_en.md` … 英語版（既存ファイルはあるが、長尺/短尺どちらにするかは未定）

### 副次的なゴール
- LAPRAS との突合で「この事実は反映済みか」を機械的に追跡できる ID 付け
- 期間ズレ・固有名詞ゆれを **1 か所の修正で全 variant に反映**
- 並行期間（3Sunny + 自社）を構造的に表現

---

## 1. 既存資産の棚卸し（ここを壊さないことが制約）

| 資産 | 役割 | 単一ソース化への影響 |
|---|---|---|
| `docs/README.md` | textlint 対象 / md-to-pdf 入力 / GitHub Pages 公開元 | **生成物**として置き続ける必要あり |
| `docs/README_en.md` | 英語版（短い） | 同上、扱い未定 |
| `docs/development/release.md` | リリース運用 | 影響なし |
| `.textlintrc.json` | textlint 設定（4 ルールセット + prh） | 生成物に対しても通る必要あり |
| `dictionary/prh*.yml` | ユビキタス言語辞書 | 生成テンプレに不適切な日本語が混じらない必要あり |
| `package.json` の `lint` / `build` スクリプト | CI 動線 | `generate` を前段に追加するだけで済む |
| `js-yaml ^4.1.0` (既に devDep) | YAML パーサ | **追加インストール不要** |
| `ts-node ^10.9.1` / `typescript ^5.0.4` | TS 実行 | **追加インストール不要** |
| Jest + ts-jest | テスト基盤 | スナップショットテスト・スキーマテストに流用可 |
| `__test__/sample.test.ts` | プレースホルダ | 生成器のテスト用に置き換え可 |
| `release.yaml`（GitHub Actions） | リリース時に `npm run build` | 前段に `npm run generate` を追加 |

→ **重要**: 既存スクリプトは `docs/README.md` をハードコードで参照している。生成物のパスを変えずに置き換えるのが最も衝突が少ない。

---

## 2. 全体アーキテクチャ

```
┌─────────────────────────┐
│  data/resume.yml        │ ← 一次ソース（人間が編集）
│  data/career_intent.yml │ ← 意欲・希望（更新頻度が違うので分離）
└────────────┬────────────┘
             │ js-yaml で読込
             ▼
┌─────────────────────────┐
│  scripts/validate.ts    │ ← Zod スキーマで型検証
└────────────┬────────────┘
             │ 検証済みオブジェクト
             ▼
┌─────────────────────────┐
│  scripts/generate.ts    │ ← variant ごとにフィルタ → テンプレ適用
└────────────┬────────────┘
             │
   ┌─────────┼─────────┐
   ▼         ▼         ▼
docs/      docs/     docs/
README.md  README_   README_
(long)     summary.  en.md
           md        (将来)
             │
             ▼ npm run lint / build
        textlint / md-to-pdf
```

### 採用するスタック
| 役割 | 採用候補 | 理由 |
|---|---|---|
| データ形式 | **YAML** | 多行テキストが多い、コメント可、diff が読める。js-yaml は既に入っている |
| スキーマ検証 | **Zod**（追加） | TS と相性◎、エラーメッセージが分かりやすい。Ajv より宣言が短い |
| テンプレート | **生 TS のテンプレート文字列** で開始 → 限界が来たら **eta** か **handlebars** に移行 | テンプレ層の複雑度はまだ未知数。最初は標準機能で済ませる |
| 生成スクリプト | **ts-node + 単一 TS ファイル** | 既存の TS/Jest 環境に乗る |
| テスト | **Jest スナップショット** | 「リファクタしても README が変わっていない」を保証するゴールデンテスト |

---

## 3. データモデル（YAML スキーマ）案

### 3.1 トップレベル

```yaml
# data/resume.yml
schema_version: "1.0"
last_synced_with_lapras: 2026-04-28  # LAPRAS 反映の追跡用

basic:
  name: 小松 優基
  birth_date: 1995-10-12
  location: 東京都
  education: 青山学院大学 物理数理学科

accounts:
  - { type: github,  url: https://github.com/yuki-koma2, label: GitHub }
  - { type: twitter, url: https://twitter.com/yukikoma4, label: Twitter }
  - { type: qiita,   url: https://qiita.com/Yuki-k-lion, label: Qiita }
  - { type: note,    url: https://note.com/koma_lion,    label: Note }
  - { type: zenn,    url: https://zenn.dev/yukikoma,     label: Zenn }
  - { type: lapras,  url: https://lapras.com/public/KGEHCDC, label: LAPRAS }

skills_summary:
  # 旧 README の「保有スキル」箇条書き相当
  - JavaScript/TypeScript React/Next.js Vue/Nuxt.js でのフロントエンド開発・設計
  - Java Spring Boot でのバックエンド開発・設計
  # ...

tech_stack:
  # skillicons.dev のバッジ生成元
  languages: [ts, js, html, css, java, ruby, kotlin]
  frameworks: [react, nextjs, vue, nuxtjs, spring, ktor, redux, sass, jest, graphql, nodejs]
  tools: [idea, github, git, aws, docker, cloudflare, githubactions]

tech_proficiency:
  # LAPRAS get_tech_skill 相当（年数つき）
  - { name: TypeScript, years: "3-5" }
  - { name: Java,       years: "3-5" }
  - { name: Node.js,    years: "2-3" }
  # ...

experiences:        # 後述
strengths:          # 後述
weaknesses:         # 後述
career_intent:      # 後述（別ファイルに切り出す案も）
```

### 3.2 `experiences`（職務経歴の本体）

```yaml
experiences:

  - id: 3sunny
    type: full_time          # full_time | side_job | internship | volunteer | own_company
    company: 株式会社3Sunny
    period:
      start: 2023-04
      end: null              # null = 現在
    employment_phases:       # 雇用形態の変遷を表現（並行期間対応）
      - { from: 2023-04, to: 2026-04, form: 正社員 }
      - { from: 2026-05, to: null,    form: 業務委託（並行）}
    summary: |
      サーバーレスで病院間入退院支援サービスを提供する SaaS 企業。
      自分は技術・組織・事業創出を横断して動いている。
    roles:
      - id: 3sunny-techlead
        title: テックリード（フルスタック）
        period: { start: 2023-04, end: 2024-08 }
        domains: [backend, frontend, infra]
        team_size: { engineers: "数名" }
        description: |
          ...
        achievements:
          - { id: ach-1, body: "Clean Architecture / DDD をフロントに落とし込みつつ疎結合高凝集の基盤作り", tags: [architecture] }
          - { id: ach-2, body: "GitHub Actions によるリリース自動化", tags: [cicd] }
        tech: [TypeScript, Vue, Firebase, GCP, Cloud Functions]
        variants: [long]      # short には出さない（古いので）
      - id: 3sunny-pdm-concurrent
        title: PdMグループ（兼任）
        period: { start: 2024-06, end: 2024-12 }
        concurrent_with: [3sunny-techlead, 3sunny-chief-engineer]  # ← 兼任を明示
        ...
        variants: [long]
      - id: 3sunny-chief
        title: チーフエンジニア
        period: { start: 2024-09, end: null }
        ...
        variants: [long, short]   # 現職・短縮版にも出す
      - id: 3sunny-pdm-main
        title: PdM主務 & 新規事業PJ
        period: { start: 2025-01, end: null }
        concurrent_with: [3sunny-chief]
        ...
        variants: [long, short]   # 現職・短縮版にも出す

  - id: own-company           # 自社（起業）
    type: own_company
    company: 株式会社[未定]
    period:
      start: 2026-05
      end: null
    parallel_with: [3sunny]   # ← 別 experience との並行関係を表現
    summary_public: |
      （公開可能な範囲で書く）
    roles:
      - id: own-ceo
        title: 代表（仮）
        period: { start: 2026-05, end: null }
        variants: [long, short]

  - id: bizreach
    type: full_time
    company: 株式会社ビズリーチ
    period: { start: 2019-04, end: 2023-03 }   # ← LAPRAS 突合で訂正
    roles:
      - id: bizreach-rearch
        title: ビズリーチ事業部 リアーキテクチャグループ（バックエンド）
        period: { start: 2022-11, end: 2023-03 }
        variants: [long]
      - id: bizreach-newbiz
        title: 社長室 新規事業推進チーム
        period: { start: 2022-06, end: 2022-10 }
        variants: [long]
      - id: bizreach-careertrek
        title: キャリトレ事業部
        period: { start: 2019-09, end: 2022-05 }   # ← LAPRAS 値で訂正
        variants: [long]
      - id: bizreach-internal
        title: 社内プロジェクト群
        period: { start: 2019-10, end: 2021-05 }
        sub_items:
          - { name: 新卒研修企画リーダー, period: 2021-02..2021-05 }
          - { name: 顧客データ分析（Datasaber）, period: 2020-10..2020-12 }
          - { name: 特別企画推進チーム, period: 2019-10..2020-03 }
        variants: [long]

  - id: lapras-side
    type: side_job
    company: LAPRAS株式会社
    role_label: 採用サポート
    period: { start: 2023-02, end: 2024-12 }
    description: |
      副業として採用サポート業務委託。詳細は控えめ。
    variants: [long]

  - id: kokorokara-side
    type: side_job
    company: 株式会社こころから
    role_label: フロントエンドエンジニア
    period: { start: 2021-09, end: 2022-12 }   # LAPRAS 値で訂正
    variants: [long]

  - id: aiesec
    type: volunteer
    # ... 既存内容を踏襲
    variants: [long]

  - id: internships
    type: internship
    items:
      - { company: 株式会社Div, period: 2018-04..2019-05, ... }
      - { company: ワークスアプリケーションズ, period: 2017-02..2017-03, ... }
      - { company: ランサーズ, period: 2018-06..2018-08, ... }
    variants: [long]
```

### 3.3 `strengths` / `weaknesses` / `career_intent`

```yaml
strengths:
  - id: s-phase-coverage
    label: フェーズ横断の経験
    body: |
      安定期、グロース期、新規事業のフェーズを全て経験してきた。
    source: lapras_job_summary
    variants: [long, short]
  - id: s-org-improvement
    label: 開発プロセス改善 / 組織を整える力
    body: |
      ...
    variants: [long, short]

weaknesses:
  - id: w-not-specialist
    label: スペシャリストではない
    body: |
      特定技術を深く探求するタイプではなく、その意思もない。
    variants: [long]

career_intent:
  current_phase: 2026年5月起業予定。3Sunny は当面業務委託として並行継続。
  motivation: |
    ...
  conditions:
    - 週2回程度の出社は問題なし。リモートでの集中時間も欲しい。
    - ...
  variants: [long]
```

### 3.4 `variants` 切り分けの方式（要決定）

候補が3つある。選択により実装の複雑度が変わる。

| 方式 | 仕組み | メリット | デメリット |
|---|---|---|---|
| **A. 明示タグ式** | 各エントリに `variants: [long, short]` を付ける | 制御が直感的、項目ごとに細かく決められる | YAML が冗長 |
| **B. レベル式** | 各エントリに `level: 1\|2\|3` を付け、long=1+2+3 / short=1 などで決める | YAML がシンプル | 中間粒度を細かく出し分けたい時にぶつかる |
| **C. ハイブリッド** | デフォルトは level、必要に応じて `variants` で上書き | 90% は level でラクできて例外も対応 | 実装が少し複雑 |

→ 推奨: **A. 明示タグ式**。職務経歴は項目数がそこまで多くなく、明示的なほうが「短縮版に何が出るか」を YAML を読むだけで把握できる。

---

## 4. レンダラ設計

### 4.1 ファイル構成（提案）

```
data/
  resume.yml
  schema/
    resume.schema.ts        # Zod スキーマ
scripts/
  generate.ts               # メインエントリ
  render/
    long.ts                 # 長尺版テンプレ
    summary.ts              # 短縮版テンプレ
  helpers/
    period.ts               # 期間整形（2023-04..null → "2023/04 ~ 現在"）
    badge.ts                # skillicons.dev URL 生成
    timeline.ts             # ASCII タイムライン生成（並行期間用、§5 参照）
__test__/
  generate.snapshot.test.ts # 生成結果のスナップショット
  resume.schema.test.ts     # YAML が schema を満たすか
docs/
  README.md                 # ← 生成物（既存ファイルを上書き）
  README_summary.md         # ← 生成物（新規）
```

### 4.2 generate.ts のフロー（疑似コード）

```ts
import yaml from 'js-yaml';
import { readFileSync, writeFileSync } from 'fs';
import { ResumeSchema } from './schema/resume.schema';
import { renderLong } from './render/long';
import { renderSummary } from './render/summary';

const raw = yaml.load(readFileSync('data/resume.yml', 'utf8'));
const data = ResumeSchema.parse(raw);             // ① 検証

writeFileSync('docs/README.md',         renderLong(data));    // ② 長尺
writeFileSync('docs/README_summary.md', renderSummary(data)); // ③ 短縮
```

### 4.3 variant フィルタの実装方針

```ts
// 共通ヘルパ
const includeIn = (variant: 'long' | 'short') =>
  (item: { variants?: string[] }) =>
    !item.variants || item.variants.includes(variant);

// long.ts 内では filter(includeIn('long'))
// summary.ts 内では filter(includeIn('short'))
```

> 🪝 **学びポイント（本人に書いてほしい）**: `summary.ts` の **短縮版で何を残すか** はビジネス判断（自分の売り出し方）。テンプレ自体は長尺版を私がドラフトしますが、短縮版テンプレ 30〜50 行は **本人が書く** のが望ましい（5〜10行で済むかもしれない）。

---

## 5. 並行期間の表現（仕組みとしての解）

### 5.1 データレベル
- `experience.parallel_with: [other_id]` で他経験との並行を宣言
- `experience.employment_phases[]` で雇用形態の変遷を表現

### 5.2 レンダリング案
- 長尺: 各 experience 見出しに `(2023/04 ~ 現在 ※2026/05 以降は並行)` を自動生成
- 長尺: ファイル冒頭に **ASCII タイムライン** を自動描画（`helpers/timeline.ts`）
  ```
  2023 ──── 2024 ──── 2025 ──── 2026 ────►
  [─────── 株式会社3Sunny ─────────────]
                            [自社 (起業) ──►]
  ```
- 短縮: タイムラインは省略、現職を 2 行で並列表記

---

## 6. 既存パイプラインとの統合

### 6.1 `package.json` への追加（案）

**Phase 1〜2（並行運用期）**: 既存スクリプトは触らず `generate` だけ追加。

```json
{
  "scripts": {
    "generate": "ts-node scripts/generate.ts",
    "lint": "textlint docs/README.md",
    "lint:generated": "textlint docs/README_generated.md docs/README_summary.md",
    "lint:fix": "npm run lint -- fix",
    "build": "md-to-pdf docs/README.md --config-file config/md-to-pdf.config.json"
  }
}
```

→ `lint:generated` は新スクリプト。既存 `lint` / `build` には**手を入れない**ことで現状維持を保証。

**Phase 2.5（スワップ後）**: スクリプトをマージし、`generate` を `build` の前段に組み込む。

```json
{
  "scripts": {
    "generate": "ts-node scripts/generate.ts",
    "lint": "textlint docs/README.md docs/README_summary.md",
    "build": "npm run generate && md-to-pdf docs/README.md --config-file config/md-to-pdf.config.json",
    "build:summary": "npm run generate && md-to-pdf docs/README_summary.md --config-file config/md-to-pdf.config.json"
  }
}
```

### 6.2 CI（GitHub Actions release.yaml）の修正
- `npm run build` 内で `generate` が走るので **既存ワークフローはほぼそのまま**
- 追加で「YAML 編集後に generate 忘れ」を防ぐチェックを CI に入れる：
  ```bash
  npm run generate && git diff --exit-code docs/
  ```
  → `docs/` に差分が出たら CI 失敗

### 6.3 textlint との関係
- 生成物の Markdown も textlint 対象にする（lint スクリプトで両方指定）
- 辞書（`dictionary/prh*.yml`）は YAML 内の本文にも有効
- 生成テンプレ側で固有名詞の表記ゆれを起こさないよう、テンプレに直書きする日本語は最小限に

---

## 7. 移行計画（フェーズ）

### Phase 0: 準備（このドキュメント）
- 設計合意

### Phase 1: スキーマ定義 & データ移植
1. `data/resume.yml` に既存 `docs/README.md` の内容を **そのまま移植**（差分は出さない）
2. `data/career_intent.yml` を分離して作成（決定 #7）
3. `Zod` スキーマ作成、Jest で「YAML が schema を満たす」テスト
4. 並行して LAPRAS 差分（diff_report §3）も YAML に反映（**ただし反映済みフラグで long にだけ出すなど慎重に**）

### Phase 2: 長尺版ジェネレータ（並行運用モード）
1. `renderLong(data)` を実装し、`docs/README_generated.md` に出力（既存 `docs/README.md` は触らない）
2. 既存 `docs/README.md` との目視比較で差分を確認
3. **完全一致を目指す段階は設けない**（決定 #8: ガードレールなし、並行運用で進む）
4. 信頼できる状態に達したら本人判断で `README.md` を `README_legacy.md` にリネーム → 生成物を `README.md` にスワップ（Phase 2.5）

### Phase 3: 短縮版テンプレ
1. `renderSummary(data)` を実装
2. テンプレは本人が中身を決める（学びポイント）
3. textlint 通過確認

### Phase 4: CI 統合
1. `package.json` 修正
2. release.yaml 動作確認

### Phase 5: 起業記載・並行期間
1. `experience.parallel_with` の対応とテンプレ調整
2. ASCII タイムライン helper 実装
3. last_year_braindump の内容を YAML に反映

### Phase 6: 英語版
- 既存 `docs/README_en.md` を生成対象にする（決定 #5）
- YAML に `_en` フィールドを追加するか、別 YAML（`data/resume_en.yml`）にするかは Phase 6 開始時に判断
- 内容ベースで翻訳が要るので、長尺すべての翻訳は重い → **短縮版から先に英訳**するのが現実的

---

## 8. リスク・トレードオフ

| リスク | 影響 | 緩和策 |
|---|---|---|
| **オーバーキル**（職務経歴 1 つで生成器を作るのは過剰） | 学習コスト・将来の自分の編集ハードル | フェーズ 0〜2 までで現状維持できる状態に到達 → 短縮版を作る前に「やめる」判断ポイントを設ける |
| 編集時の認知負荷増 | typo 修正で YAML を触るのが面倒に感じる | typo は dictionary/prh で吸収、軽微な変更は textlint --fix で対応 |
| **生成物コミットの是非** | YAML 編集→生成忘れが起きる | CI で `git diff --exit-code` チェック |
| テンプレに HTML/Markdown の罠 | 微妙な改行差異で md-to-pdf 出力が変わる | スナップショットテストで防衛 |
| LAPRAS 自体の更新フロー | YAML を真にしても LAPRAS は手動更新になる | LAPRAS への push スクリプトを将来検討（mcp_lapras には update_experience 等あり）|
| 起業会社の社名未確定で固有名詞ゆれ | 公開後の修正コストが大きい | YAML の `company: 株式会社[未定]` プレースホルダ、`generate` 時に警告 |

---

## 9. 採用しなかった選択肢

| 選択肢 | 不採用理由 |
|---|---|
| **JSON Resume** スキーマ（json-resume.org の標準） | 海外の標準で日本の職務経歴書フォーマットと相性が悪い、独自セクション（意欲・興味）を表現しにくい |
| **TOML** | 多行テキストの可読性が YAML に劣る |
| **JSON** 直書き | コメント不可、多行が辛い |
| **MDX / Markdown フロントマター + 本文** | 半構造化で逆に variant 切り分けが難しい |
| **Pandoc + 独自フィルタ** | 学習コストに対するリターンが薄い |
| **SaaS（Notion API → 生成）** | このリポジトリの自己完結性を壊す |
| **ファイル分割（経歴ごとに 1 ファイル）** | 並行期間や cross reference を扱う時に複雑化 |

---

## 10. 本人に決めてほしい論点（→ §0.5 に確定済み）

> ✅ すべて 2026-04-28 に回答済み。詳細は §0.5 参照。

1. ~~YAML vs JSON~~ → ✅ YAML
2. ~~variants 切り分け方式~~ → ✅ A. 明示タグ式
3. ~~生成物のコミット是非~~ → ✅ コミットする
4. ~~短縮版のファイル名~~ → ✅ `docs/README_summary.md`
5. ~~英語版の扱い~~ → ✅ 既存 `README_en.md` を変換対象にする
6. ~~起業会社名の扱い~~ → ✅ プレースホルダで進める
7. ~~`career_intent` の置き場~~ → ✅ 別ファイル `data/career_intent.yml`
8. ~~「やめる」判断ポイント~~ → ✅ ガードレールは設けない／ただし既存 README は別ファイルとして残し並行運用

---

## 11. このドキュメント自体の取り扱い

- 設計検討段階の文書なので `task_memory/` 配下
- 設計が確定したら、要点を `docs/development/` に正式ドキュメント化（例: `docs/development/single_source_workflow.md`）
- 実装フェーズに入る時は別ブランチを切る想定

---

## 12. 次のアクション（合意後）

1. §10 の論点に YES/NO を貰う
2. Phase 1 のチケット化（`data/resume.yml` 雛形作成、Zod スキーマ、Jest テスト）
3. Phase 2 で **既存 README と完全一致** を確認
4. そこではじめて「短縮版を作る」フェーズに進む（本人が短縮版テンプレを書く）
