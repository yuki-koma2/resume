/**
 * 長尺版（詳細レジュメ）レンダラ。
 *
 * 入力: ResumeSchema / CareerIntentSchema を満たす検証済みオブジェクト。
 * 出力: textlint を通せる Markdown 文字列。
 *
 * セクション構成は既存 docs/README.md にできるだけ寄せる：
 *   - 基本情報 / 各種アカウント / 保有スキル / 技術スタック
 *   - 職務経歴詳細（own_company + full_time + volunteer）
 *   - インターンシップ等（internship）
 *   - その他の活動（short_project / side_job）
 *   - 強み / 弱み（LAPRAS 由来、新規セクション）
 *   - 意欲・興味 / 希望条件（career_intent.yml 由来）
 *
 * variants フィルタ: variants に 'long' を含むエントリのみ出力。
 */

import {
    Resume,
    CareerIntent,
} from '../schema/resume.schema';
import { formatPeriod, Period } from '../helpers/period';
import { skillIconsBadge } from '../helpers/badge';
import { renderTimeline, type TimelineEntry } from '../helpers/timeline';

type Variant = 'long' | 'short' | 'en';
type WithVariants = { variants: Variant[] };
type Experience = Resume['experiences'][number];
type Role = NonNullable<Experience['roles']>[number];

const inLong = <T extends WithVariants>(item: T): boolean =>
    item.variants.includes('long');

const HR = '---';

// 設計書 §5.2 / 判断 1-A: タイムラインに含める experience は主要 3 つだけ。
// （副業・インターン・ボランティアはバーに出さず本文で扱う）
const KEY_EXPERIENCE_IDS = ['bizreach', '3sunny', 'own-company'] as const;

// タイムラインのバー内で使うラベル。company に「[」等の特殊文字や長い社名がある場合に短縮する。
// own-company は YAML 上 `株式会社[未定]` プレースホルダだが、バーの `[` と紛らわしいため固定ラベル化。
const TIMELINE_LABEL_OVERRIDE: Record<string, string> = {
    'own-company': '自社（起業）',
};

// ───────────────────────────────────────────
// セクションごとのレンダラ
// ───────────────────────────────────────────

const renderTimelineSection = (resume: Resume): string => {
    const byId = new Map(resume.experiences.map((e) => [e.id, e]));
    const entries: TimelineEntry[] = [];
    for (const id of KEY_EXPERIENCE_IDS) {
        const exp = byId.get(id);
        if (!exp) continue;
        const label = TIMELINE_LABEL_OVERRIDE[id] ?? exp.company;
        entries.push({ label, period: exp.period });
    }
    if (entries.length === 0) return '';

    const years = entries.flatMap((e) => {
        const ys = [Number(e.period.start.slice(0, 4))];
        if (e.period.end) ys.push(Number(e.period.end.slice(0, 4)));
        return ys;
    });
    const yearStart = Math.min(...years);
    // end:null の experience があるなら、最終年は yearStart の起点から見て今を含む年。
    // 純粋関数を保つため、YAML 内の最も新しい開始年 + 1 をフォールバックとする。
    const hasOngoing = entries.some((e) => e.period.end === null);
    const yearEnd = hasOngoing
        ? Math.max(...entries.map((e) => Number(e.period.start.slice(0, 4)))) + 1
        : Math.max(...years);

    const note = hasOngoing
        ? '\n※ 3Sunny は 2026/05 以降、自社（起業）と業務委託で並行（予定）'
        : '';

    const body = [
        '```',
        renderTimeline(entries, { yearStart, yearEnd, charsPerYear: 8 }),
        '```',
    ].join('\n');

    return ['## キャリアタイムライン', body, note.trim()]
        .filter((s) => s.length > 0)
        .join('\n\n');
};

const renderBasicInfo = (b: Resume['basic']): string =>
    [
        '## 基本情報',
        '',
        '| key  | value        |',
        '|------|--------------|',
        `| 氏名   | ${b.name}        |`,
        `| 生年月日 | ${b.birth_date}   |`,
        `| 居住地  | ${b.location}          |`,
        `| 最終学歴 | ${b.education} |`,
    ].join('\n');

const renderAccounts = (accounts: Resume['accounts']): string =>
    [
        '## 各種アカウント',
        ...accounts.map((a) => `- [${a.label}](${a.url})`),
    ].join('\n');

const renderSkillsSummary = (skills: string[]): string =>
    ['## 保有スキル', '', ...skills.map((s) => `- ${s}`)].join('\n');

const renderTechStack = (t: Resume['tech_stack']): string =>
    [
        '## 技術スタック',
        '',
        '### 言語',
        '',
        skillIconsBadge(t.languages),
        '',
        '### フレームワーク',
        '',
        skillIconsBadge(t.frameworks),
        '',
        '### 開発環境等',
        '',
        skillIconsBadge(t.tools),
    ].join('\n');

const renderTechProficiency = (list: Resume['tech_proficiency']): string => {
    if (list.length === 0) return '';
    return [
        '## 技術別経験年数',
        '',
        '| 技術 | 経験年数 |',
        '|------|---------|',
        ...list.map((p) => `| ${p.name} | ${p.years} |`),
    ].join('\n');
};

const renderEmploymentPhases = (
    phases: NonNullable<Experience['employment_phases']>
): string =>
    [
        '- 雇用形態',
        ...phases.map((ph) => {
            const period = formatPeriod({ start: ph.from, end: ph.to });
            return `  - ${period}：${ph.form}`;
        }),
    ].join('\n');

const renderParallelWith = (
    refs: string[],
    allExps: Experience[]
): string => {
    const labels = refs
        .map((id) => allExps.find((e) => e.id === id)?.company)
        .filter((s): s is string => Boolean(s));
    if (labels.length === 0) return '';
    return `- 並行：${labels.join('、')}`;
};

const renderTechBullets = (tech: string[]): string[] => {
    // textlint の sentence-length 制約（100 文字）を避けるため、
    // 4 件以上のときは多行 bullet にする（既存 docs/README.md の慣習に倣う）。
    if (tech.length === 0) return [];
    if (tech.length <= 3) {
        return [`- 使用技術：${tech.join('、')}`];
    }
    return ['- 使用技術', ...tech.map((t) => `  - ${t}`)];
};

const renderRole = (role: Role): string => {
    const lines: string[] = [];
    lines.push(`#### ${role.title}`);
    lines.push('');
    lines.push(`- 期間：${formatPeriod(role.period as Period)}`);
    if (role.domains?.length) {
        lines.push(`- 担当領域：${role.domains.join(' / ')}`);
    }
    if (role.concurrent_with?.length) {
        lines.push(`- 兼任：${role.concurrent_with.join('、')}`);
    }
    if (role.tech?.length) {
        lines.push(...renderTechBullets(role.tech));
    }
    if (role.description) {
        lines.push('');
        lines.push(role.description.trim());
    }
    if (role.achievements?.length) {
        lines.push('');
        lines.push('- やったこと');
        for (const ach of role.achievements) {
            lines.push(`  - ${ach.body}`);
        }
    }
    if (role.sub_items?.length) {
        lines.push('');
        for (const sub of role.sub_items) {
            lines.push(`- ${sub.name}（${sub.period}）`);
            if (sub.body) lines.push(`  - ${sub.body}`);
        }
    }
    return lines.join('\n');
};

const renderExperienceHeader = (
    exp: Experience,
    allExps: Experience[]
): string => {
    const lines: string[] = [];
    lines.push(`### ${exp.company}（${formatPeriod(exp.period)}）`);
    lines.push('');
    if (exp.role_label) {
        lines.push(`- 役割：${exp.role_label}`);
    }
    if (exp.parallel_with?.length) {
        lines.push(renderParallelWith(exp.parallel_with, allExps));
    }
    if (exp.employment_phases?.length) {
        lines.push(renderEmploymentPhases(exp.employment_phases));
    }
    if (exp.tech?.length) {
        lines.push(...renderTechBullets(exp.tech));
    }
    const summary = exp.summary || exp.summary_public || exp.description;
    if (summary) {
        lines.push('');
        lines.push(summary.trim());
    }
    return lines.join('\n');
};

const renderExperience = (
    exp: Experience,
    allExps: Experience[]
): string => {
    const blocks: string[] = [renderExperienceHeader(exp, allExps)];
    const roles = (exp.roles ?? []).filter(inLong);
    for (const r of roles) {
        blocks.push('');
        blocks.push(renderRole(r));
    }
    return blocks.join('\n');
};

const renderJobHistory = (resume: Resume): string => {
    const main = resume.experiences.filter(
        (e) =>
            inLong(e) &&
            (e.type === 'own_company' || e.type === 'full_time' || e.type === 'volunteer')
    );
    if (main.length === 0) return '';
    const blocks = ['## 職務経歴詳細', ''];
    for (const exp of main) {
        blocks.push(renderExperience(exp, resume.experiences));
        blocks.push('');
    }
    return blocks.join('\n').trimEnd();
};

const renderInternships = (resume: Resume): string => {
    const ins = resume.experiences.filter(
        (e) => inLong(e) && e.type === 'internship'
    );
    if (ins.length === 0) return '';
    const blocks = ['## インターンシップ等', ''];
    for (const exp of ins) {
        blocks.push(`### ${exp.company}`);
        blocks.push('');
        blocks.push(`- 期間：${formatPeriod(exp.period)}`);
        if (exp.role_label) blocks.push(`- 役割：${exp.role_label}`);
        if (exp.tech?.length) blocks.push(...renderTechBullets(exp.tech));
        if (exp.description) {
            blocks.push('');
            blocks.push(exp.description.trim());
        }
        blocks.push('');
    }
    return blocks.join('\n').trimEnd();
};

const renderOtherActivities = (resume: Resume): string => {
    const shortProjects = resume.experiences.filter(
        (e) => inLong(e) && e.type === 'short_project'
    );
    const sideJobs = resume.experiences.filter(
        (e) => inLong(e) && e.type === 'side_job'
    );
    if (shortProjects.length === 0 && sideJobs.length === 0) return '';

    const blocks = ['## その他の活動', ''];

    if (shortProjects.length > 0) {
        blocks.push('### 短期プロジェクト');
        blocks.push('');
        for (const exp of shortProjects) {
            blocks.push(`#### ${exp.company}（${formatPeriod(exp.period)}）`);
            blocks.push('');
            if (exp.role_label) blocks.push(`- 役割：${exp.role_label}`);
            if (exp.tech?.length)
                blocks.push(`- 使用技術：${exp.tech.join(', ')}`);
            if (exp.description) {
                blocks.push('');
                blocks.push(exp.description.trim());
            }
            blocks.push('');
        }
    }

    if (sideJobs.length > 0) {
        blocks.push('### 副業');
        blocks.push('');
        for (const exp of sideJobs) {
            blocks.push(`#### ${exp.company}（${formatPeriod(exp.period)}）`);
            blocks.push('');
            if (exp.role_label) blocks.push(`- 役割：${exp.role_label}`);
            if (exp.tech?.length)
                blocks.push(`- 使用技術：${exp.tech.join(', ')}`);
            if (exp.description) {
                blocks.push('');
                blocks.push(exp.description.trim());
            }
            blocks.push('');
        }
    }

    return blocks.join('\n').trimEnd();
};

const renderStrengthsWeaknesses = (resume: Resume): string => {
    const s = resume.strengths.filter(inLong);
    const w = resume.weaknesses.filter(inLong);
    const blocks: string[] = [];
    if (s.length > 0) {
        blocks.push('## 強み');
        blocks.push('');
        for (const x of s) {
            blocks.push(`- **${x.label}**：${x.body.trim()}`);
        }
    }
    if (w.length > 0) {
        if (blocks.length > 0) blocks.push('');
        blocks.push('## 弱み');
        blocks.push('');
        for (const x of w) {
            blocks.push(`- **${x.label}**：${x.body.trim()}`);
        }
    }
    return blocks.join('\n');
};

const renderCareerIntent = (intent: CareerIntent): string => {
    const blocks: string[] = [];
    blocks.push('## 意欲・興味');
    blocks.push('');
    blocks.push(intent.motivation.trim());
    blocks.push(HR);
    blocks.push('## 希望条件');
    blocks.push('');
    for (const c of intent.conditions) blocks.push(`- ${c}`);
    return blocks.join('\n');
};

// ───────────────────────────────────────────
// エントリポイント
// ───────────────────────────────────────────

export const renderLong = (
    resume: Resume,
    intent: CareerIntent
): string => {
    const sections: string[] = [
        '# 職務経歴書',
        renderBasicInfo(resume.basic),
        renderAccounts(resume.accounts),
        HR,
        renderTimelineSection(resume),
        HR,
        renderSkillsSummary(resume.skills_summary),
        HR,
        renderTechStack(resume.tech_stack),
        renderTechProficiency(resume.tech_proficiency),
        renderJobHistory(resume),
        renderInternships(resume),
        HR,
        renderOtherActivities(resume),
        HR,
        renderStrengthsWeaknesses(resume),
        HR,
        renderCareerIntent(intent),
    ];
    // 空セクション（出力対象が無いブロック）は除外し、残りを空行で区切る。
    return sections.filter((s) => s.length > 0).join('\n\n') + '\n';
};
