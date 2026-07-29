/**
 * 短縮版（カジュアル面談・スカウト返信用）レンダラ。
 *
 * 設計: task_memory/20260428/resume_update/single_source_design.md §7.2
 *
 * 方針:
 *   - 1〜2 ページ、長尺版の半分以下のボリューム
 *   - 構成: タイトル + tagline / elevator_pitch / 強み / 直近の役割 / 連絡先
 *   - variants に 'short' を含むエントリのみ出す
 *   - 弱みは原則 short には出さない（YAML 側で variants に short を含めない設計）
 */

import {
    Resume,
    CareerIntent,
} from '../schema/resume.schema';
import { formatPeriod } from '../helpers/period';

type Variant = 'long' | 'short' | 'en';
type WithVariants = { variants: Variant[] };
type Experience = Resume['experiences'][number];
type Role = NonNullable<Experience['roles']>[number];

const inShort = <T extends WithVariants>(item: T): boolean =>
    item.variants.includes('short');

// ───────────────────────────────────────────
// セクション
// ───────────────────────────────────────────

const renderHeader = (resume: Resume): string =>
    `# ${resume.basic.name} — 職務経歴 要約版`;

const renderLead = (lead: NonNullable<Resume['summary_lead']>): string =>
    [`> ${lead.tagline}`, '', lead.elevator_pitch.trim()].join('\n');

const renderStrengths = (strengths: Resume['strengths']): string => {
    const items = strengths.filter(inShort);
    if (items.length === 0) return '';
    return [
        '## 強み',
        '',
        ...items.map((s) => `- **${s.label}**：${s.body.trim()}`),
    ].join('\n');
};

const renderWeaknesses = (weaknesses: Resume['weaknesses']): string => {
    const items = weaknesses.filter(inShort);
    if (items.length === 0) return '';
    return [
        '## 弱み',
        '',
        ...items.map((w) => `- **${w.label}**：${w.body.trim()}`),
    ].join('\n');
};

const renderRoleCompact = (role: Role): string => {
    // 短縮版では役割タイトル + 期間 + 1〜2 行の要約のみ。
    // role.description が長い場合は最初のパラグラフだけ取る。
    const period = formatPeriod(role.period);
    const lines: string[] = [`- **${role.title}**（${period}）`];
    if (role.description) {
        const firstPara = role.description
            .trim()
            .split('\n')
            .find((l) => l.trim().length > 0);
        if (firstPara) lines.push(`  - ${firstPara.trim()}`);
    }
    return lines.join('\n');
};

const renderExperienceCompact = (exp: Experience): string => {
    const period = formatPeriod(exp.period);
    const lines: string[] = [`### ${exp.company}（${period}）`, ''];

    const summary = exp.summary || exp.summary_public || exp.description;
    if (summary) {
        // 1〜3 行を目安に短く。
        const trimmed = summary.trim().split('\n').slice(0, 3).join('\n');
        lines.push(trimmed);
    }

    const shortRoles = (exp.roles ?? []).filter(inShort);
    if (shortRoles.length > 0) {
        lines.push('');
        for (const r of shortRoles) {
            lines.push(renderRoleCompact(r));
        }
    }
    return lines.join('\n');
};

const renderRecentRoles = (resume: Resume): string => {
    const exps = resume.experiences.filter(inShort);
    if (exps.length === 0) return '';
    const blocks: string[] = ['## 直近の主な役割', ''];
    for (const exp of exps) {
        blocks.push(renderExperienceCompact(exp));
        blocks.push('');
    }
    return blocks.join('\n').trimEnd();
};

const renderContacts = (accounts: Resume['accounts']): string => {
    if (accounts.length === 0) return '';
    return [
        '## 連絡先・公開情報',
        '',
        accounts.map((a) => `[${a.label}](${a.url})`).join(' / '),
    ].join('\n');
};

// ───────────────────────────────────────────
// エントリポイント
// ───────────────────────────────────────────

export const renderSummary = (
    resume: Resume,
    _intent: CareerIntent
): string => {
    const sections: string[] = [
        renderHeader(resume),
        resume.summary_lead ? renderLead(resume.summary_lead) : '',
        renderStrengths(resume.strengths),
        renderRecentRoles(resume),
        renderWeaknesses(resume.weaknesses),
        renderContacts(resume.accounts),
    ];
    return sections.filter((s) => s.length > 0).join('\n\n') + '\n';
};
