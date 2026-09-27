import { afterEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../storage';
import { loadBest, saveBest } from './score';

describe('best score', () =>
{
    afterEach(() => localStorage.clear());

    it('is 0 when nothing or garbage is stored', () =>
    {
        expect(loadBest()).toBe(0);
        localStorage.setItem(STORAGE_KEYS.best, 'not a number');
        expect(loadBest()).toBe(0);
        localStorage.setItem(STORAGE_KEYS.best, '-5');
        expect(loadBest()).toBe(0);
    });

    it('keeps the highest score and returns it', () =>
    {
        expect(saveBest(120)).toBe(120);
        expect(saveBest(80)).toBe(120);
        expect(loadBest()).toBe(120);
        expect(saveBest(300)).toBe(300);
    });
});
