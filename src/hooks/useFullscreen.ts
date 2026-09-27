import { useCallback, useSyncExternalStore } from 'react';

// ScreenOrientation.lock is not in every TypeScript DOM lib yet
type LockableOrientation = ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> };

const subscribe = (onChange: () => void) =>
{
    document.addEventListener('fullscreenchange', onChange);

    return () => document.removeEventListener('fullscreenchange', onChange);
};

// Fullscreen where the browser allows it (not on iPhone Safari); on phones it also tries to
// lock the screen in landscape, which only works while in fullscreen
export function useFullscreen ()
{
    const active = useSyncExternalStore(subscribe, () => document.fullscreenElement !== null);
    const supported = document.fullscreenEnabled === true;

    const toggle = useCallback(async () =>
    {
        try
        {
            if (document.fullscreenElement)
            {
                await document.exitFullscreen();
                return;
            }
            await document.documentElement.requestFullscreen();
            await (screen.orientation as LockableOrientation).lock?.('landscape');
        }
        catch
        {
            // Refused by the browser or the user: the game keeps working in the window
        }
    }, []);

    return { supported, active, toggle };
}
