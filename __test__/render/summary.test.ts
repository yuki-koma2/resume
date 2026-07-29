/**
 * 短縮版（README_summary.md）レンダラのテスト。
 *
 * 担保したい性質:
 *   - 冒頭に summary_lead.tagline / elevator_pitch が出る
 *   - variants に 'short' を含むエントリのみが出る
 *   - 長尺だけのエントリ（ビズリーチ・古い 3Sunny ロール等）は出ない
 *   - 強みは [long, short] のものが出る、長尺のみ ([long]) のものは出ない
 *   - 弱みセクションは短縮版では原則出さない（YAML 側で variants に short を入れない設計）
 *   - 出力は長尺版より明確に短い
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
import { renderSummary } from '../../scripts/render/summary';

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

describe('renderSummary (real YAML)', () => {
    let md: string;

    beforeAll(() => {
        md = renderSummary(loadResume(), loadIntent());
    });

    test('starts with a header that contains the user name', () => {
        expect(md).toMatch(/^# .*小松 優基/);
    });

    test('renders summary_lead tagline as a blockquote', () => {
        expect(md).toContain('> 事業創出を担えるエンジニア');
    });

    test('renders summary_lead elevator pitch', () => {
        expect(md).toContain('安定期・グロース期・新規事業');
    });

    test('includes a 強み section with at least one entry', () => {
        expect(md).toContain('## 強み');
        // s-phase-coverage は variants: [long, short]
        expect(md).toContain('フェーズ横断');
    });

    test('omits a strength flagged only as long (s-org-builder)', () => {
        expect(md).not.toContain('チーム立ち上げ・課題解決の地力');
    });

    test('includes 株式会社3Sunny (variants: long, short)', () => {
        expect(md).toContain('株式会社3Sunny');
    });

    test('includes the own_company placeholder for the planned 起業', () => {
        expect(md).toContain('株式会社[未定]');
    });

    test('omits 株式会社ビズリーチ (variants: long only)', () => {
        expect(md).not.toContain('ビズリーチ');
    });

    test('omits 3sunny-techlead role (variants: long only)', () => {
        expect(md).not.toContain('テックリード（フルスタック）');
    });

    test('includes 3sunny-pdm-main and 3sunny-chief (variants: long, short)', () => {
        expect(md).toContain('PdMグループ（主務）& 新規事業PJ');
        expect(md).toContain('チーフエンジニア');
    });

    test('does not render a 弱み section when no weakness has variants:short', () => {
        expect(md).not.toContain('## 弱み');
    });

    test('renders a compact 連絡先 / 公開情報 section', () => {
        expect(md).toMatch(/連絡先|公開情報/);
        expect(md).toContain('GitHub');
    });

    test('summary output is meaningfully shorter than long output', () => {
        const longMd = renderLong(loadResume(), loadIntent());
        // 経験的に summary は long の半分以下を狙う。
        expect(md.length).toBeLessThan(longMd.length / 2);
    });
});

describe('renderSummary (variant filter sanity)', () => {
    const minimalIntent: CareerIntent = CareerIntentSchema.parse({
        schema_version: '1.0',
        current_phase: 'x',
        motivation: 'm',
        conditions: [],
    });

    test('omits experience whose variants is ["long"] only', () => {
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
                    id: 'long-only-co',
                    type: 'full_time',
                    company: 'LongOnlyCo',
                    period: { start: '2020-01', end: null },
                    variants: ['long'],
                },
                {
                    id: 'short-co',
                    type: 'full_time',
                    company: 'ShortCo',
                    period: { start: '2021-01', end: null },
                    variants: ['long', 'short'],
                },
            ],
            strengths: [],
            weaknesses: [],
        });

        const out = renderSummary(data, minimalIntent);
        expect(out).not.toContain('LongOnlyCo');
        expect(out).toContain('ShortCo');
    });
});
