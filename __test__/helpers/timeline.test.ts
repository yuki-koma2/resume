/**
 * ASCII タイムライン helper のテスト。
 *
 * 設計: task_memory/20260428/resume_update/single_source_design.md §5.2
 *
 * API 設計のキーポイント:
 *   - 純粋関数。Date.now() / new Date() に依存しない（yearStart / yearEnd を引数で渡す）
 *   - 月解像度で位置計算（年 = 12 単位 → charsPerYear に変換）
 *   - 日本語社名は東アジア幅（全角=2 / 半角=1）で表示幅を計算
 */

import {
    renderYearHeader,
    renderTimeline,
    type TimelineEntry,
} from '../../scripts/helpers/timeline';

describe('renderYearHeader', () => {
    it('単一年は 4 桁の年だけを返す', () => {
        expect(renderYearHeader({ yearStart: 2023, yearEnd: 2023, charsPerYear: 8 }))
            .toBe('2023');
    });

    it('複数年を charsPerYear 幅で並べ、末尾はパディングしない', () => {
        // 2023, 2024 をそれぞれ 8 文字幅で並べる → 末尾の空白は trimEnd で除去
        expect(renderYearHeader({ yearStart: 2023, yearEnd: 2024, charsPerYear: 8 }))
            .toBe('2023    2024');
    });

    it('charsPerYear: 4 の最小幅でも年が並ぶ', () => {
        expect(renderYearHeader({ yearStart: 2023, yearEnd: 2025, charsPerYear: 4 }))
            .toBe('202320242025');
    });
});

describe('renderTimeline', () => {
    it('1 行目に年ヘッダーが来る', () => {
        const entries: TimelineEntry[] = [
            { label: 'A', period: { start: '2023-01', end: '2024-01' } },
        ];
        const result = renderTimeline(entries, {
            yearStart: 2023,
            yearEnd: 2024,
            charsPerYear: 8,
        });
        const lines = result.split('\n');
        expect(lines[0]).toBe('2023    2024');
    });

    it('終了日があるバーは [ ... ] で囲まれる', () => {
        const entries: TimelineEntry[] = [
            { label: 'bizreach', period: { start: '2019-04', end: '2023-03' } },
        ];
        const result = renderTimeline(entries, {
            yearStart: 2019,
            yearEnd: 2026,
            charsPerYear: 8,
        });
        const lines = result.split('\n');
        expect(lines[1]).toMatch(/^\s*\[─.*bizreach.*─\]\s*$/);
    });

    it('end が null のバーは ──► で終わる', () => {
        const entries: TimelineEntry[] = [
            { label: '3sunny', period: { start: '2023-04', end: null } },
        ];
        const result = renderTimeline(entries, {
            yearStart: 2023,
            yearEnd: 2026,
            charsPerYear: 8,
        });
        const lines = result.split('\n');
        expect(lines[1]).toMatch(/─►$/);
    });

    it('複数 experience は別行に並ぶ', () => {
        const entries: TimelineEntry[] = [
            { label: 'bizreach', period: { start: '2019-04', end: '2023-03' } },
            { label: '3sunny', period: { start: '2023-04', end: null } },
            { label: 'own', period: { start: '2026-05', end: null } },
        ];
        const result = renderTimeline(entries, {
            yearStart: 2019,
            yearEnd: 2026,
            charsPerYear: 8,
        });
        const lines = result.split('\n');
        // 1: 年ヘッダー / 2-4: 3 つの experience
        expect(lines).toHaveLength(4);
        expect(lines[1]).toContain('bizreach');
        expect(lines[2]).toContain('3sunny');
        expect(lines[3]).toContain('own');
    });

    it('バーの開始位置は period.start に対応する', () => {
        // 2020-01 は yearStart=2019 から 12 ヶ月後 → charsPerYear=12 なら位置 12
        const entries: TimelineEntry[] = [
            { label: 'X', period: { start: '2020-01', end: '2021-01' } },
        ];
        const result = renderTimeline(entries, {
            yearStart: 2019,
            yearEnd: 2022,
            charsPerYear: 12,
        });
        const lines = result.split('\n');
        // バー行は先頭に 12 文字の空白、その後 '['
        expect(lines[1].slice(0, 12)).toBe(' '.repeat(12));
        expect(lines[1][12]).toBe('[');
    });

    it('日本語ラベル（全角文字）も表示幅で中央揃えされる', () => {
        const entries: TimelineEntry[] = [
            { label: '株式会社A', period: { start: '2023-01', end: '2024-01' } },
        ];
        const result = renderTimeline(entries, {
            yearStart: 2023,
            yearEnd: 2024,
            charsPerYear: 12,
        });
        const lines = result.split('\n');
        expect(lines[1]).toContain('株式会社A');
        // 開始 [ と終了 ] は両端に存在する
        expect(lines[1]).toMatch(/^\[.*\]$/);
    });
});
