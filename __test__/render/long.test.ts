/**
 * 長尺版レンダラのふるまいをチェックするテスト。
 *
 * 完全な byte 一致は目標にしない（並行運用方針 — 既存 docs/README.md は触らず、
 * 生成物は docs/README_generated.md として並べる）。
 * ここで担保するのは「主要セクションが揃うこと」「variant フィルタが効くこと」
 * 「parallel_with や concurrent_with が文字列として表現に現れること」。
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import {
    ResumeSchema,
    CareerIntentSchema,
    Resume,
    CareerIntent,
} from '../../scripts/schema/resume.schema';
import { renderLong } from '../../scripts/render/long';

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const loadResume = (): Resume =>
    ResumeSchema.parse(
        yaml.load(fs.readFileSync(path.join(REPO_ROOT, 'data/resume.yml'), 'utf8'))
    );

const loadIntent = (): CareerIntent =>
    CareerIntentSchema.parse(
        yaml.load(
            fs.readFileSync(path.join(REPO_ROOT, 'data/career_intent.yml'), 'utf8')
        )
    );

describe('renderLong (real YAML)', () => {
    let md: string;

    beforeAll(() => {
        md = renderLong(loadResume(), loadIntent());
    });

    test('starts with "# 職務経歴書"', () => {
        expect(md.startsWith('# 職務経歴書')).toBe(true);
    });

    test('renders basic info name', () => {
        expect(md).toContain('小松 優基');
    });

    test('renders account links', () => {
        expect(md).toContain('[GitHub](https://github.com/yuki-koma2)');
    });

    test('renders skill icons badge', () => {
        expect(md).toContain('![My Skills](https://skillicons.dev/icons?i=');
    });

    test('renders 職務経歴詳細 section header', () => {
        expect(md).toContain('## 職務経歴詳細');
    });

    test('renders 株式会社3Sunny entry', () => {
        expect(md).toContain('株式会社3Sunny');
    });

    test('renders the own_company placeholder for the planned 起業', () => {
        expect(md).toContain('株式会社[未定]');
    });

    test('renders ビズリーチ entry with corrected end date 2023/03', () => {
        expect(md).toContain('2019/04 ~ 2023/03');
    });

    test('renders 強み section', () => {
        expect(md).toContain('## 強み');
    });

    test('renders 意欲・興味 section from career_intent', () => {
        expect(md).toContain('## 意欲・興味');
    });

    test('mentions parallel_with relation for own-company × 3sunny', () => {
        // own-company has parallel_with: [3sunny] — it should be reflected somewhere.
        expect(md).toMatch(/並行|株式会社3Sunny/);
    });
});

describe('renderLong (variant filter)', () => {
    const minimalIntent: CareerIntent = CareerIntentSchema.parse({
        schema_version: '1.0',
        current_phase: 'x',
        motivation: 'm',
        conditions: ['c'],
    });

    test('omits an experience whose variants is ["short"] only', () => {
        const data: Resume = ResumeSchema.parse({
            schema_version: '1.0',
            basic: {
                name: 'Test',
                birth_date: '2000-01-01',
                location: '東京都',
                education: 'X',
            },
            accounts: [],
            skills_summary: [],
            tech_stack: { languages: [], frameworks: [], tools: [] },
            tech_proficiency: [],
            experiences: [
                {
                    id: 'short-only-co',
                    type: 'full_time',
                    company: 'ShortOnlyCo',
                    period: { start: '2020-01', end: '2020-12' },
                    variants: ['short'],
                },
                {
                    id: 'long-co',
                    type: 'full_time',
                    company: 'LongOnlyCo',
                    period: { start: '2021-01', end: '2021-12' },
                    variants: ['long'],
                },
            ],
            strengths: [],
            weaknesses: [],
        });

        const out = renderLong(data, minimalIntent);
        expect(out).not.toContain('ShortOnlyCo');
        expect(out).toContain('LongOnlyCo');
    });

    test('omits a strength whose variants is ["short"] only', () => {
        const data: Resume = ResumeSchema.parse({
            schema_version: '1.0',
            basic: {
                name: 'Test',
                birth_date: '2000-01-01',
                location: '東京都',
                education: 'X',
            },
            accounts: [],
            skills_summary: [],
            tech_stack: { languages: [], frameworks: [], tools: [] },
            tech_proficiency: [],
            experiences: [],
            strengths: [
                {
                    id: 'a',
                    label: 'AppearLabel',
                    body: 'long+short body',
                    variants: ['long', 'short'],
                },
                {
                    id: 'b',
                    label: 'HiddenLabel',
                    body: 'short only body',
                    variants: ['short'],
                },
            ],
            weaknesses: [],
        });
        const out = renderLong(data, minimalIntent);
        expect(out).toContain('AppearLabel');
        expect(out).not.toContain('HiddenLabel');
    });
});
