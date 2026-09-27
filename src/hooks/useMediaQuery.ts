import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery (query: string): boolean
{
    // Stable per query, so React does not re-subscribe on every render of the caller
    const subscribe = useCallback((onChange: () => void) =>
    {
        const list = window.matchMedia(query);
        list.addEventListener('change', onChange);

        return () => list.removeEventListener('change', onChange);
    }, [ query ]);

    return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

export const usePortrait = () => useMediaQuery('(orientation: portrait)');
export const useTouch = () => useMediaQuery('(pointer: coarse)');
