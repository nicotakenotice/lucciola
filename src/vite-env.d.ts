/// <reference types="vite/client" />

interface Window
{
    __LUCCIOLA__?: {
        game: import('phaser').Game;
        debug: () => import('./game/debug').GameDebugApi | null;
    };
}
