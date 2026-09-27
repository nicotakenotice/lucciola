export const WIDTH = 1280;
export const HEIGHT = 720;

export const FONT_UI = '"Quicksand", "Trebuchet MS", sans-serif';

// Parametri di bilanciamento
export const TUNING = {
    nightLength: 150,       // secondi fino all'alba
    energyDecay: 3.0,       // luce persa al secondo...
    energyDecayGrowth: 0.005, // ...più questo valore per ogni secondo di notte trascorso
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
    splendorDuration: 7,    // secondi di Splendore dopo la Rugiada lunare
    splendorRadius: 0.5,    // +50% di raggio di luce durante lo Splendore
    splendorBurn: 2.5,      // le Ombre bruciano 2.5 volte più in fretta
    dewEnergy: 15,
    dewFirst: 28,           // la prima Rugiada compare dopo 28 secondi
    dewInterval: [ 35, 50 ],
    dewLifetime: 12,
    waves: [ 45, 95, 128 ], // secondi in cui arriva un'ondata di Ombre
    colossusFrom: 70,
    colossusInterval: 40,
    colossusDimRange: 260,  // entro questa distanza il Colosso affievolisce la luce
    colossusDim: 0.35       // fino al -35% di raggio
} as const;

export type ShadowKind = 'shade' | 'moth' | 'colossus';

export interface ShadowSpec
{
    hp: number;             // per le Ombre comuni viene moltiplicato per la taglia
    speed: [ number, number ];
    size: [ number, number ];
    lightSlow: number;      // moltiplicatore di velocità dentro la luce
    burn: number;           // moltiplicatore di danno dalla luce
    points: number;         // punti se bruciata dalla luce
    flashPoints: number;    // punti se dissolta dal Lampo
    hitEnergy: number;      // luce persa al contatto (senza sciame)
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
        // storage non disponibile: il record vale solo per questa sessione
    }

    return best;
}
