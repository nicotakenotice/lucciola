import { describe, expect, it } from 'vitest';
import { parseArgs, tuningProblems, UsageError } from './balance-args.mjs';

describe('balance arguments', () =>
{
    it('has sensible defaults', () =>
    {
        expect(parseArgs([])).toEqual({ seeds: [ 1, 2, 3, 4, 5, 6 ], parallel: 1, tuning: {} });
    });

    it('parses seeds, parallel and tuning', () =>
    {
        expect(parseArgs([ '--seeds', '3, 7', '--parallel', '2', '--tuning', '{"waveGrowth":1}' ]))
            .toEqual({ seeds: [ 3, 7 ], parallel: 2, tuning: { waveGrowth: 1 } });
    });

    it.each([
        [ [ '--seeds', '' ], /--seeds must be/ ],
        [ [ '--seeds', '1,x' ], /--seeds must be/ ],
        [ [ '--parallel', '0' ], /--parallel must be a positive integer/ ],
        [ [ '--tuning', '{bad' ], /--tuning is not valid JSON/ ],
        [ [ '--tuning', '[1]' ], /--tuning must be a JSON object/ ],
        [ [ '--tuning' ], /--tuning needs a value/ ],
        [ [ '--seed', '1' ], /unknown option "--seed"/ ],
        [ [ '7' ], /unknown option "7"/ ]
    ])('rejects %j with a readable message', (argv, message) =>
    {
        expect(() => parseArgs(argv)).toThrow(UsageError);
        expect(() => parseArgs(argv)).toThrow(message);
    });
});

describe('tuning overrides', () =>
{
    const current = { energyDecayGrowth: 0.004, waves: [ 45, 95 ] };

    it('accepts known keys with the same type', () =>
    {
        expect(tuningProblems({ energyDecayGrowth: 0.003, waves: [ 50 ] }, current)).toEqual([]);
    });

    it('rejects misspelled keys and type changes', () =>
    {
        expect(tuningProblems({ energyDecayGrowht: 0.001, waves: 3 }, current)).toEqual([
            'unknown TUNING key "energyDecayGrowht"',
            'TUNING.waves must be an array, got number'
        ]);
    });
});
