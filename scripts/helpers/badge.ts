/**
 * skillicons.dev の URL / Markdown 画像記法を生成するヘルパ。
 */

export const skillIconsUrl = (skills: string[]): string =>
    `https://skillicons.dev/icons?i=${skills.join(',')}`;

export const skillIconsBadge = (skills: string[]): string =>
    `![My Skills](${skillIconsUrl(skills)})`;
