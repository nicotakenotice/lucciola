/// <reference types="vite/client" />

interface Window
{
    __LUCCIOLA__?: {
        game: import('phaser').Game;
        tuning: Record<string, unknown>;
        debug: () => import('./game/debug').GameDebugApi | null;
    };
}
