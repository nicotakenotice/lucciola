// Parses and validates the arguments of scripts/balance.mjs. Kept apart so it can be unit tested.

export class UsageError extends Error {}

export const USAGE = 'usage: npm run balance -- [--seeds 1,2,3] [--parallel 1] [--tuning \'{"waveGrowth":1}\']';

const OPTIONS = [ 'seeds', 'parallel', 'tuning' ];

export function parseArgs (argv)
{
    const values = {};
    for (let i = 0; i < argv.length; i += 2)
    {
        const [ flag, value ] = [ argv[i], argv[i + 1] ];
        const name = flag.replace(/^--/, '');
        if (!flag.startsWith('--') || !OPTIONS.includes(name))
        {
            throw new UsageError(`unknown option "${flag}" (expected ${OPTIONS.map((o) => `--${o}`).join(', ')})`);
        }
        if (value === undefined || value.startsWith('--')) throw new UsageError(`${flag} needs a value`);
        values[name] = value;
    }

    return {
        seeds: parseSeeds(values.seeds ?? '1,2,3,4,5,6'),
        parallel: parsePositiveInteger(values.parallel ?? '1', '--parallel'),
        tuning: parseTuning(values.tuning ?? '{}')
    };
}

function parseSeeds (text)
{
    const parts = text.split(',').map((part) => part.trim());
    if (parts.some((part) => !/^\d+$/.test(part)))
    {
        throw new UsageError(`--seeds must be comma-separated non-negative integers, got "${text}"`);
    }

    return parts.map(Number);
}

function parsePositiveInteger (text, flag)
{
    if (!/^[1-9]\d*$/.test(text)) throw new UsageError(`${flag} must be a positive integer, got "${text}"`);

    return Number(text);
}

function parseTuning (text)
{
    let value;
    try
    {
        value = JSON.parse(text);
    }
    catch (error)
    {
        throw new UsageError(`--tuning is not valid JSON (${error.message})`);
    }
    if (value === null || typeof value !== 'object' || Array.isArray(value))
    {
        throw new UsageError('--tuning must be a JSON object, e.g. \'{"waveGrowth":1}\'');
    }

    return value;
}

// Compares overrides with the game's current TUNING: an unknown key or a different type would be
// applied silently and change nothing, which is worse than failing
export function tuningProblems (overrides, current)
{
    const kind = (value) => (Array.isArray(value) ? 'array' : typeof value);
    const article = (word) => (/^[aeiou]/.test(word) ? `an ${word}` : `a ${word}`);

    return Object.entries(overrides).flatMap(([ key, value ]) =>
    {
        if (!(key in current)) return [ `unknown TUNING key "${key}"` ];
        if (kind(value) !== kind(current[key])) return [ `TUNING.${key} must be ${article(kind(current[key]))}, got ${kind(value)}` ];

        return [];
    });
}
