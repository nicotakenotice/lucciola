import { useEffect } from 'react';
import { music, sfx } from '../audio';

// Browsers only start audio after a user gesture, and iOS only accepts some of them
// (touchend, click, keydown — not touchstart/pointerdown). Music starts on the first one,
// already in the menu. The audio button handles its own click.
const GESTURES = [ 'pointerdown', 'touchend', 'click', 'keydown' ] as const;

export function useAudioUnlock ()
{
    useEffect(() =>
    {
        const unlock = (event: Event) =>
        {
            if (event.target instanceof Element && event.target.closest('[data-audio-toggle]')) return;
            if (event instanceof KeyboardEvent && event.code === 'KeyM') return;
            sfx.unlock();
            music.start();
            // pointerdown alone may not unlock iOS: keep listening until a trusted gesture sticks
            if (event.type !== 'pointerdown') GESTURES.forEach((type) => window.removeEventListener(type, unlock));
        };

        GESTURES.forEach((type) => window.addEventListener(type, unlock));

        return () => GESTURES.forEach((type) => window.removeEventListener(type, unlock));
    }, []);
}
