import { useEffect } from 'react';

// Pauses the game when the window loses focus, the tab is hidden or the device turns to portrait
export function useAutoPause (playing: boolean, portrait: boolean, pause: () => void)
{
    useEffect(() =>
    {
        if (!playing) return;
        if (portrait)
        {
            pause();
            return;
        }

        const onVisibility = () =>
        {
            if (document.hidden) pause();
        };
        window.addEventListener('blur', pause);
        document.addEventListener('visibilitychange', onVisibility);

        return () =>
        {
            window.removeEventListener('blur', pause);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [ playing, portrait, pause ]);
}
