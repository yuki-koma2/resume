# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A personal Japanese-language resume (職務経歴書) for `yuki-koma2`, version-controlled and continuously integrated. The resume **content** lives in `docs/README.md` — that is the single source of truth that gets linted, rendered to GitHub Pages, and built to PDF. Almost everything else in the repo exists to validate or publish that one file.

Node version is pinned to `19.2.0` via `.node-version`.




### リポジトリの役割

- `docs/README.md` — レジュメ、職務経歴書の本体（PDF/GitHub Pages の元データ）
- `docs/README_en.md` — 英語版レジュメ（短いサマリ用途も含む）
- `docs/development/` — **正式ドキュメント**（リリース手順・運用規約。新規メンテナ向け）
- `task_memory/YYYYMMDD/<project_name>/` — 作業過程の記録・一時的な作業・調査結果（git 管理外を想定）
- ルート直下の設定ファイル（package.json、CLAUDE.md、各種設定）

### ドキュメント分類の指針
- **docs/development/**: 新規エンジニアが読むべき正式ドキュメント
- **task_memory/YYYYMMDD/project_name/**: 作業過程の記録・一時的な作業用（通常は作業完了後に整理）。調査・分析結果は日付とタスク名配下に残し、短期の調査メモは `task_memory/YYYYMMDD/project_name/work_log` などの専用ディレクトリを切ってまとめる。

### レジュメ更新ワークフロー
- 真実は `docs/README.md`。ただし対外的なポートフォリオは LAPRAS にも分散しており、**LAPRAS と乖離が出やすい**。
- 大幅更新（major: 転職・新プロジェクト・ロール変更）の前には MCP `lapras` の `get_experiences` / `get_job_summary` / `get_tech_skill` / `get_want_to_do` を取得し、`task_memory/YYYYMMDD/resume_update/` に差分レポートを残してから本体を編集する。
- 職務経歴書は **長いバージョン（詳細版）と短いバージョン（要約版）** の2系統を併存させる方針。現状 `docs/README.md` は詳細版。短縮版を派生で作る際もこの一次ソースから抽出する。


## Common commands

```shell
npm install              # install dependencies
npm run lint             # textlint docs/README.md (CI runs this)
npm run lint:fix         # textlint --fix
npm test                 # jest (collectCoverage is on by default)
npm run build            # md-to-pdf docs/README.md -> dist/resume.pdf
```

Run a single test: `npx jest <path-or-name-pattern>` (e.g. `npx jest dictionary`).

## Linting architecture

The textlint config (`.textlintrc.json`) layers four Japanese-prose rule sets plus a `prh` rule that loads project-specific dictionaries:

- `dictionary/prh.yml` — entry point that imports the others
- `dictionary/prh_ubiquitous.yml` — ubiquitous-language enforcement (e.g. flags outdated product names like `キャリアトレック → キャリトレ`)
- `dictionary/typo.yml` — typo corrections

When adding terms the project should standardize on, edit the dictionary YAMLs rather than the textlint config. The `dictionary/__tests__/ubiquitous.test.ts` test for the custom dictionary is currently `it.skip`'d — known limitation, not a regression.

## Release flow

Releases are driven by `.github/workflows/release.yaml`, triggered manually via `workflow_dispatch` with a `releaseSize` input. The workflow:

1. `npm run build` → produces `dist/resume.pdf`
2. `mathieudutour/github-tag-action` bumps the tag using the chosen size
3. Creates a GitHub Release and uploads `dist/resume.pdf` as `resume.pdf`

Versioning convention from `README.md`:

| size  | when                                   | cadence       |
| ----- | -------------------------------------- | ------------- |
| major | job change, new project, role change   | yearly        |
| minor | new accomplishments, periodic review   | quarterly     |
| patch | typos                                  | as discovered |

A separate `reminder.yaml` workflow opens a quarterly "update your resume" issue via cron.

## PDF build configuration

`config/md-to-pdf.config.json` controls PDF output (A4, 30mm/20mm margins, page numbers in footer, monokai code highlighting) and references `config/md-to-pdf.css` for styling. Output goes to `dist/resume.pdf`, which the release workflow uploads as a release asset.

## Notes on the test setup

`__test__/sample.test.ts` is a placeholder. Real assertions live (or will live) in `dictionary/__tests__/`. Jest is configured via `jest.config.js` with `collectCoverage: true` and v8 coverage — expect a `coverage/` directory after running tests locally.

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
- `/office-hours`
- `/plan-ceo-review`
- `/plan-eng-review`
- `/plan-design-review`
- `/design-consultation`
- `/design-shotgun`
- `/design-html`
- `/review`
- `/ship`
- `/land-and-deploy`
- `/canary`
- `/benchmark`
- `/browse`
- `/connect-chrome`
- `/qa`
- `/qa-only`
- `/design-review`
- `/setup-browser-cookies`
- `/setup-deploy`
- `/setup-gbrain`
- `/retro`
- `/investigate`
- `/document-release`
- `/codex`
- `/cso`
- `/autoplan`
- `/plan-devex-review`
- `/devex-review`
- `/careful`
- `/freeze`
- `/guard`
- `/unfreeze`
- `/gstack-upgrade`
- `/learn`
