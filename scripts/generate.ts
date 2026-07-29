/**
 * 単一ソース YAML から長尺版 Markdown を生成するエントリスクリプト。
 *
 * 並行運用方針（task_memory/20260428/resume_update/single_source_design.md §0.5）：
 *   - 既存の docs/README.md は触らない
 *   - 生成物は docs/README_generated.md に書き出す
 *   - 信頼が貯まった段階で別途スワップする
 *
 * 使い方: npm run generate
 */

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import {
    ResumeSchema,
    CareerIntentSchema,
} from './schema/resume.schema';
import { renderLong } from './render/long';
import { renderSummary } from './render/summary';

const REPO_ROOT = path.resolve(__dirname, '..');
const RESUME_YML = path.join(REPO_ROOT, 'data', 'resume.yml');
const CAREER_YML = path.join(REPO_ROOT, 'data', 'career_intent.yml');
const OUT_LONG = path.join(REPO_ROOT, 'docs', 'README_generated.md');
const OUT_SUMMARY = path.join(REPO_ROOT, 'docs', 'README_summary.md');

const log = (msg: string): void => {
    // eslint-disable-next-line no-console
    console.log(msg);
};

const autofix = (file: string): void => {
    // textlint の自動修正（ja-spacing 系の半全角スペース等）を生成物に適用する。
    // 修正不能な指摘（sentence-length / no-doubled-joshi など）は残るが、終了コードは
    // 無視して書き込みを失敗扱いしない。残った指摘は npm run lint:generated で確認できる。
    const r = spawnSync('npx', ['textlint', '--fix', '--no-color', file], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
    });
    if (r.stdout?.trim()) log(r.stdout.trim());
};

const main = (): void => {
    const resume = ResumeSchema.parse(
        yaml.load(fs.readFileSync(RESUME_YML, 'utf8'))
    );
    const intent = CareerIntentSchema.parse(
        yaml.load(fs.readFileSync(CAREER_YML, 'utf8'))
    );

    const longMd = renderLong(resume, intent);
    fs.writeFileSync(OUT_LONG, longMd, 'utf8');
    log(`✔ wrote ${path.relative(REPO_ROOT, OUT_LONG)} (${longMd.length} chars)`);

    const summaryMd = renderSummary(resume, intent);
    fs.writeFileSync(OUT_SUMMARY, summaryMd, 'utf8');
    log(
        `✔ wrote ${path.relative(REPO_ROOT, OUT_SUMMARY)} (${summaryMd.length} chars)`
    );

    autofix(OUT_LONG);
    autofix(OUT_SUMMARY);
};

main();
