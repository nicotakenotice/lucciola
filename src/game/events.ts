export const Events = {
    SceneReady: 'current-scene-ready',
    Hud: 'hud',
    Hint: 'hint',
    GameEnd: 'game-end',
    UiStart: 'ui-start',
    UiRestart: 'ui-restart',
    UiMenu: 'ui-menu',
    UiPause: 'ui-pause',
    UiResume: 'ui-resume',
    UiFlash: 'ui-flash',
    Paused: 'paused'
} as const;

export interface HudState
{
    energy: number;         // 0..100
    followers: number;
    maxFollowers: number;
    score: number;
    combo: number;          // consecutive pollen pickups (0 = no combo)
    splendor: number;       // 0..1, remaining Radiance time
    flashReady: boolean;
    flashMin: number;
    nightProgress: number;  // 0..1
    secondsToDawn: number;
    dawn: boolean;
    alive: boolean;         // false after game over or at dawn
}

export type HintTone = 'info' | 'danger' | 'gift';

export interface Hint
{
    text: string;
    tone: HintTone;
}

export interface GameStats
{
    pollen: number;
    rescued: number;
    dissolved: number;
    maxSwarm: number;
    flashes: number;
    dew: number;
}

export interface GameEndResult
{
    kind: 'over' | 'dawn';
    score: number;
    best: number;
    newRecord: boolean;
    seconds: number;
    bonus: number;
    stats: GameStats;
}
