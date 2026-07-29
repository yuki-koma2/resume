# yuki komatsu Resume

転職サイトだと自分の思うように書けないので、自由に書き定期的に更新するようにgithubで書いて管理します。
自分のキャリアの棚卸しにも使用する想定です。

## See This 職務経歴書はこちらのリンクから
- [Markdown](docs/README.md)
- [Github Pages](https://yuki-koma2.github.io/resume/)
- TBD web site
- [PDFはこちらからダウンロード](https://github.com/yuki-koma2/resume/releases)

## ディレクトリ構成

```
.
├── docs/                  # 履歴書本体（GitHub Pages の公開対象）
│   ├── README.md          # 履歴書の本文（textlint / md-to-pdf の入力）
│   ├── README_en.md       # 英語版（未着手）
│   └── _config.yml        # GitHub Pages 設定
├── dictionary/            # textlint の prh 辞書
│   ├── prh.yml            # エントリポイント（他辞書を import）
│   ├── prh_ubiquitous.yml # ユビキタス言語（旧名称の検知 等）
│   └── typo.yml           # 誤字訂正
├── config/                # md-to-pdf の設定（JSON / CSS）
├── __test__/              # Jest テスト（プレースホルダ）
├── .github/workflows/     # CI / リリース / 更新リマインダ
└── dist/                  # 生成された PDF の出力先（.gitignore 対象）
```

## Development


### Setup

```shell
$ git clone
$ cd resume
$ npm install
```

### lint

文章チェック

```shell
npm run lint
```

自動修正

```shell
npm run lint:fix
```

### Release 

#### リリースの単位

単位 | 概要 | 想定頻度
:--: | :--: | :--: 
major | 転職、プロジェクトの追加、異動 | 年単位
minor | 実績の追記や定期的な見直し | 四半期
patch | 誤字脱字 | 発見次第逐次

#### リリース方法

GitHub Actions の `release and build pdf` ワークフロー（`.github/workflows/release.yaml`）を `workflow_dispatch` から手動実行します。実行時に `releaseSize`（`patch` / `minor` / `major`）を選択すると、以下が自動で行われます。

1. `npm run build` で `docs/README.md` から `dist/resume.pdf` を生成
2. `mathieudutour/github-tag-action` で選択したサイズに応じたタグを採番
3. GitHub Release を作成し、`dist/resume.pdf` を `resume.pdf` という名前のアセットとしてアップロード

リリース後は [Releases ページ](https://github.com/yuki-koma2/resume/releases) から PDF を取得できます。



## References
参考にさせていただいています
- [GitHubの機能をフルに使って職務経歴書の継続的インテグレーションを実現する](https://zenn.dev/ryo_kawamata/articles/resume-on-github)
