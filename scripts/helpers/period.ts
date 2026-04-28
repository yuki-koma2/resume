/**
 * 期間整形ヘルパ。
 * YAML の YYYY-MM 形式を「YYYY/MM ~ YYYY/MM」「YYYY/MM ~ 現在」に変換する。
 */

export type Period = { start: string; end: string | null };

const slash = (ym: string): string => ym.replace('-', '/');

export const formatPeriod = (p: Period): string =>
    p.end === null
        ? `${slash(p.start)} ~ 現在`
        : `${slash(p.start)} ~ ${slash(p.end)}`;
