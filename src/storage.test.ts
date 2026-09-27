import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStorage, STORAGE_KEYS, writeStorage } from './storage';

describe('storage', () =>
{
    afterEach(() =>
    {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('reads back what it writes', () =>
    {
        expect(writeStorage(STORAGE_KEYS.lang, 'it')).toBe(true);
        expect(readStorage(STORAGE_KEYS.lang)).toBe('it');
    });

    it('degrades to "nothing saved" when storage throws', () =>
    {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });

        expect(readStorage(STORAGE_KEYS.best)).toBeNull();
        expect(writeStorage(STORAGE_KEYS.best, '10')).toBe(false);
    });
});
