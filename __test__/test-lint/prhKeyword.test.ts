/**
 * textlint パイプライン（.textlintrc.json + dictionary/prh*.yml）の end-to-end チェック。
 *
 * 元コミット (2ddf5db) は古い TextLintEngine API + 必ず失敗する assertion で
 * 壊れていたため修正。
 *
 * textlint の programmatic API（createLinter / loadTextlintrc）は Jest 環境下で
 * .textlintrc.json の rules を空で返す挙動を確認している（プラグインは読まれるが
 * rule は読まれない）。原因は textlint × babel-jest の require 解決の相互作用と
 * 思われるが本質ではないため、CLI を spawn して end-to-end で検証する形にした。
 *
 * ここで担保したいのは「dictionary/prh*.yml に登録された旧名称が実際に検出される」
 * という挙動そのもの。Jest API で内部実装に詳しく踏み込む価値はない。
 */

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const runTextlint = (markdown: string): { stdout: string; status: number | null } => {
    const tmp = path.join(REPO_ROOT, `.textlint-test-${process.pid}.md`);
    fs.writeFileSync(tmp, markdown, 'utf8');
    try {
        const r = spawnSync('npx', ['textlint', '--no-color', tmp], {
            cwd: REPO_ROOT,
            encoding: 'utf8',
        });
        return { stdout: `${r.stdout}\n${r.stderr}`, status: r.status };
    } finally {
        fs.unlinkSync(tmp);
    }
};

describe('textlint pipeline (CLI end-to-end)', () => {
    test('flags deprecated term キャリアトレック → キャリトレ', () => {
        const { stdout, status } = runTextlint('キャリアトレックを利用しました。\n');
        expect(stdout).toContain('キャリトレ');
        expect(status).not.toBe(0);
    });

    test('passes a clean string with no violations', () => {
        const { stdout, status } = runTextlint('問題のない普通の文章です。\n');
        expect(stdout).not.toContain('error');
        expect(status).toBe(0);
    });
});
