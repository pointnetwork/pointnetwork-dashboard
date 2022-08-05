import {pickMultipleRandomly} from './random';

describe('pickMultipleRandomly', () => {
    const seed =
    'radar label try injury moment own relief strategy park first famous hub';

    const input = seed.split(' ');
    const output = pickMultipleRandomly(input, 4);

    it('picks 4 words from a string[]', () => {
        expect(output).toHaveLength(4);
    });

    it('picks words contained in the input array', () => {
        output.forEach(i => expect(input).toContain(i.word));
    });

    it('returns the correct index for the picked words', () => {
        output.forEach(({word, idx}) => expect(word).toBe(input[idx]));
    });

    it('does not pick any duplicates', () => {
    // Run it 100 times.
        for (let i = 0; i < 100; i++) {
            const picks = pickMultipleRandomly(input, 3);

            const seen: Record<string, number> = {};
            picks.forEach(pick => {
                seen[pick.word] = (seen[pick.word] || 0) + 1;
            });

            Object.keys(seen).forEach(k => expect(seen[k]).toBe(1));
        }
    });
});
