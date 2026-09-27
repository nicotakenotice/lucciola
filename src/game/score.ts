import { readStorage, STORAGE_KEYS, writeStorage } from '../storage';

export function loadBest (): number
{
    const best = Number(readStorage(STORAGE_KEYS.best));

    return Number.isFinite(best) && best > 0 ? best : 0;
}

// Stores the score if it beats the best one and returns the best score
export function saveBest (score: number): number
{
    const best = Math.max(loadBest(), score);
    writeStorage(STORAGE_KEYS.best, String(best));

    return best;
}
