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

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import {
    ResumeSchema,
    CareerIntentSchema,
} from './schema/resume.schema';
import { renderLong } from './render/long';

const REPO_ROOT = path.resolve(__dirname, '..');
const RESUME_YML = path.join(REPO_ROOT, 'data', 'resume.yml');
const CAREER_YML = path.join(REPO_ROOT, 'data', 'career_intent.yml');
const OUT_LONG = path.join(REPO_ROOT, 'docs', 'README_generated.md');

const main = (): void => {
    const resume = ResumeSchema.parse(
        yaml.load(fs.readFileSync(RESUME_YML, 'utf8'))
    );
    const intent = CareerIntentSchema.parse(
        yaml.load(fs.readFileSync(CAREER_YML, 'utf8'))
    );

    const longMd = renderLong(resume, intent);
    fs.writeFileSync(OUT_LONG, longMd, 'utf8');

    // eslint-disable-next-line no-console
    console.log(`✔ wrote ${path.relative(REPO_ROOT, OUT_LONG)} (${longMd.length} chars)`);
};

main();
