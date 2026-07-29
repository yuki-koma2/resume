import { formatPeriod } from '../../scripts/helpers/period';

describe('formatPeriod', () => {
    test('formats {start, end:null} as "2023/04 ~ 現在"', () => {
        expect(formatPeriod({ start: '2023-04', end: null })).toBe('2023/04 ~ 現在');
    });

    test('formats {start, end} as "2019/04 ~ 2023/03"', () => {
        expect(formatPeriod({ start: '2019-04', end: '2023-03' })).toBe('2019/04 ~ 2023/03');
    });

    test('preserves leading zero in month', () => {
        expect(formatPeriod({ start: '2024-09', end: null })).toBe('2024/09 ~ 現在');
    });
});
