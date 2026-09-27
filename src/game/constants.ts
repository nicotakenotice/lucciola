export const WIDTH = 1280;
export const HEIGHT = 720;

export const FONT_UI = '"Quicksand", "Trebuchet MS", sans-serif';

export const TUNING = {
    nightLength: 150,       // seconds until dawn
    energyDecay: 3.0,       // light lost per second...
    energyDecayGrowth: 0.005, // ...plus this amount for every second of night elapsed
    baseRadius: 70,
    radiusPerEnergy: 1.7,
    radiusPerFollower: 7,
    maxFollowers: 12,
    playerSpeed: 270,
    pollenEnergy: 8,
    pollenMax: 14,
    lostEnergy: 18,
    flashCost: 18,
    flashMin: 22,
    flashRange: 300,
    flashCooldown: 1.1,
    hitEnergy: 26,
    maxShadows: 12,
    splendorDuration: 7,    // seconds of Radiance after collecting Moon dew
    splendorRadius: 0.5,    // +50% light radius during Radiance
    splendorBurn: 2.5,      // Shadows burn 2.5 times faster
    dewEnergy: 15,
    dewFirst: 28,           // the first Moon dew appears after 28 seconds
    dewInterval: [ 35, 50 ],
    dewLifetime: 12,
    waves: [ 45, 95, 128 ], // seconds at which a wave of Shadows arrives
    colossusFrom: 70,
    colossusInterval: 40,
    colossusDimRange: 260,  // within this distance the Colossus dims the light
    colossusDim: 0.35       // up to -35% of the radius
} as const;

export type ShadowKind = 'shade' | 'moth' | 'colossus';

export interface ShadowSpec
{
    hp: number;             // multiplied by size for common Shadows
    speed: [ number, number ];
    size: [ number, number ];
    lightSlow: number;      // speed multiplier inside the light
    burn: number;           // damage multiplier from the light
    points: number;         // points when burned by the light
    flashPoints: number;    // points when dissolved by a Flash
    hitEnergy: number;      // light lost on contact (with no swarm)
    eye: number;
}

export const SHADOWS: Record<ShadowKind, ShadowSpec> = {
    shade: { hp: 2.2, speed: [ 55, 80 ], size: [ 0.8, 1.25 ], lightSlow: 0.62, burn: 1, points: 15, flashPoints: 25, hitEnergy: 26, eye: 0xff5a6e },
    moth: { hp: 0.9, speed: [ 105, 130 ], size: [ 0.55, 0.7 ], lightSlow: 0.8, burn: 1.2, points: 20, flashPoints: 30, hitEnergy: 16, eye: 0xd98bff },
    colossus: { hp: 10, speed: [ 30, 38 ], size: [ 2.0, 2.3 ], lightSlow: 0.85, burn: 0.55, points: 120, flashPoints: 120, hitEnergy: 38, eye: 0xffa040 }
};

const BEST_KEY = 'lucciola.best';

export function loadBest (): number
{
    try
    {
        return Number(localStorage.getItem(BEST_KEY)) || 0;
    }
    catch
    {
        return 0;
    }
}

export function saveBest (score: number): number
{
    const best = Math.max(loadBest(), score);

    try
    {
        localStorage.setItem(BEST_KEY, String(best));
    }
    catch
    {
        // storage unavailable: the best score only lasts for this session
    }

    return best;
}
