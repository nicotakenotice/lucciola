// localStorage can be missing or throw (private browsing, blocked site data): every access goes
// through here and degrades to "nothing saved".

export const STORAGE_KEYS = {
    best: 'lucciola.best',
    muted: 'lucciola.muted',
    lang: 'lucciola.lang'
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function readStorage (key: StorageKey): string | null
{
    try
    {
        return localStorage.getItem(key);
    }
    catch
    {
        return null;
    }
}

export function writeStorage (key: StorageKey, value: string): boolean
{
    try
    {
        localStorage.setItem(key, value);

        return true;
    }
    catch
    {
        return false;
    }
}
