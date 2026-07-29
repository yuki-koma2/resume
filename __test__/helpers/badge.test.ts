import { skillIconsUrl, skillIconsBadge } from '../../scripts/helpers/badge';

describe('skillIconsUrl', () => {
    test('joins skill ids with comma', () => {
        expect(skillIconsUrl(['ts', 'js'])).toBe('https://skillicons.dev/icons?i=ts,js');
    });

    test('returns base URL when list is empty', () => {
        expect(skillIconsUrl([])).toBe('https://skillicons.dev/icons?i=');
    });
});

describe('skillIconsBadge', () => {
    test('wraps URL in Markdown image syntax', () => {
        expect(skillIconsBadge(['ts', 'js'])).toBe(
            '![My Skills](https://skillicons.dev/icons?i=ts,js)'
        );
    });
});
