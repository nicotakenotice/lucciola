import { describe, expect, it } from 'vitest';
import { it as italian } from './it';
import { en as english } from './en';

const tags = (text: string) => [ ...text.matchAll(/<(\w+)>/g) ].map((m) => m[1]).sort();
const params = (text: string) => [ ...text.matchAll(/\{(\w+)\}/g) ].map((m) => m[1]).sort();
const keys = Object.keys(italian) as (keyof typeof italian)[];

describe('dictionaries', () =>
{
    it('have exactly the same keys', () =>
    {
        expect(Object.keys(english).sort()).toEqual([ ...keys ].sort());
    });

    it.each(keys)('"%s" uses the same tags and parameters in every language', (key) =>
    {
        expect(tags(english[key])).toEqual(tags(italian[key]));
        expect(params(english[key])).toEqual(params(italian[key]));
    });

    it.each(keys)('"%s" is not empty and its tags are balanced', (key) =>
    {
        for (const text of [ italian[key], english[key] ])
        {
            expect(text.trim()).not.toBe('');
            const opened = [ ...text.matchAll(/<(\w+)>/g) ].length;
            const closed = [ ...text.matchAll(/<\/(\w+)>/g) ].length;
            expect(closed).toBe(opened);
        }
    });
});
