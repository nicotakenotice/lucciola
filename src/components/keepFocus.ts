import type { MouseEvent } from 'react';

// Small controls (sound, language, pause) do not take focus on mouse click:
// otherwise SPACE, which starts the game or fires a Flash, would "click" them again.
// They stay reachable with the keyboard (Tab).
export const keepFocus = (e: MouseEvent) => e.preventDefault();
