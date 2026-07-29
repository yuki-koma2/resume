/**
 * ASCII タイムライン描画ヘルパ。
 *
 * 設計: task_memory/20260428/resume_update/single_source_design.md §5.2
 *
 * 純粋関数として実装。今日依存（Date.now）を入れず、yearStart / yearEnd は呼び出し側で決める。
 *
 * 出力例（charsPerYear: 8）:
 *   2019    2020    2021    2022    2023    2024    2025    2026
 *   [────── 株式会社ビズリーチ ──────]
 *                                   [────── 株式会社3Sunny ──────►
 *                                                                 [自社 ──►
 */

export type TimelineEntry = {
    label: string;
    period: { start: string; end: string | null };
};

export type TimelineOptions = {
    yearStart: number;
    yearEnd: number;
    charsPerYear?: number;
};

const DEFAULT_CHARS_PER_YEAR = 8;

// ───────────────────────────────────────────
// 内部ヘルパ
// ───────────────────────────────────────────

/**
 * 文字列の表示幅（東アジア幅）。ASCII は 1、それ以外（CJK 等）は 2 として概算する。
 * バー内のラベル中央寄せに使う。
 */
const displayWidth = (s: string): number => {
    let w = 0;
    for (const ch of s) {
        const code = ch.codePointAt(0)!;
        w += code < 0x80 ? 1 : 2;
    }
    return w;
};

/** "YYYY-MM" を yearStart 起点の月数に変換。*/
const monthsFrom = (yearStart: number, ym: string): number => {
    const [y, m] = ym.split('-').map(Number);
    return (y - yearStart) * 12 + (m - 1);
};

/** 月数を文字位置に換算。charsPerYear=12 なら 1 ヶ月 = 1 文字。*/
const toCharPosition = (months: number, charsPerYear: number): number =>
    Math.round((months * charsPerYear) / 12);

// ───────────────────────────────────────────
// 公開 API
// ───────────────────────────────────────────

export const renderYearHeader = (opts: {
    yearStart: number;
    yearEnd: number;
    charsPerYear: number;
}): string => {
    const { yearStart, yearEnd, charsPerYear } = opts;
    const parts: string[] = [];
    for (let y = yearStart; y <= yearEnd; y++) {
        parts.push(String(y).padEnd(charsPerYear, ' '));
    }
    return parts.join('').trimEnd();
};

/**
 * 1 つの experience を 1 行のバーとして描画する。
 *
 * - end あり: `[───── label ─────]`
 * - end が null: `[───── label ─────►`（描画範囲の右端まで矢印）
 *
 * バー幅が label の表示幅 + 2（両端の括弧）に満たない場合は、ラベルを優先してバーを伸ばす。
 */
const renderBar = (
    entry: TimelineEntry,
    yearStart: number,
    yearEnd: number,
    charsPerYear: number
): string => {
    const startMonths = monthsFrom(yearStart, entry.period.start);
    const startPos = toCharPosition(startMonths, charsPerYear);

    // end が null のときは、yearEnd の年末（12 月末 = 翌年 1 月）まで線を引く。
    const endMonths = entry.period.end
        ? monthsFrom(yearStart, entry.period.end)
        : (yearEnd - yearStart + 1) * 12;
    const endPos = toCharPosition(endMonths, charsPerYear);

    const isOngoing = entry.period.end === null;
    const closer = isOngoing ? '─►' : ']';
    const closerWidth = isOngoing ? 2 : 1;
    const labelWidth = displayWidth(entry.label);

    // バー全体の幅: 開始 '[' 1 文字 + 中身 + 終端
    // 中身の最小幅は label を入れて両側 1 文字以上の '─' が欲しい → label + 2
    const innerWidthRaw = endPos - startPos - 1 - closerWidth;
    const innerWidth = Math.max(innerWidthRaw, labelWidth + 2);

    const padTotal = innerWidth - labelWidth;
    const padLeft = Math.floor(padTotal / 2);
    const padRight = padTotal - padLeft;

    const bar = '[' + '─'.repeat(padLeft) + entry.label + '─'.repeat(padRight) + closer;

    return ' '.repeat(startPos) + bar;
};

export const renderTimeline = (
    entries: TimelineEntry[],
    opts: TimelineOptions
): string => {
    const charsPerYear = opts.charsPerYear ?? DEFAULT_CHARS_PER_YEAR;
    const lines: string[] = [
        renderYearHeader({
            yearStart: opts.yearStart,
            yearEnd: opts.yearEnd,
            charsPerYear,
        }),
    ];
    for (const entry of entries) {
        lines.push(renderBar(entry, opts.yearStart, opts.yearEnd, charsPerYear));
    }
    return lines.join('\n');
};
