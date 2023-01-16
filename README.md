# yuki komatsu Resume

転職サイトだと自分の思うように書けないので、自由に書き定期的に更新するようにgithubで書いて管理します。
自分のキャリアの棚卸しにも使用する想定です。

## See This 職務経歴書はこちらのリンクから
- [Markdown](docs/README.md)
- [Github Pages](https://yuki-koma2.github.io/resume/)
- TBD web site
- [PDFはこちらからダウンロード](https://github.com/yuki-koma2/resume/releases)

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

github actionから手動実行でタグ付け＆リリースを行う。


## References
参考にさせていただいています
- [GitHubの機能をフルに使って職務経歴書の継続的インテグレーションを実現する](https://zenn.dev/ryo_kawamata/articles/resume-on-github)
