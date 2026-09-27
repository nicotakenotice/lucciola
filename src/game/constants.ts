export const WIDTH = 1280;
export const HEIGHT = 720;

export const FONT_UI = '"Quicksand", "Trebuchet MS", sans-serif';

export const TUNING = {
    // Night and light
    nightLength: 150,           // seconds until dawn
    energyDecay: 3.0,           // light lost per second...
    energyDecayGrowth: 0.005,   // ...plus this amount for every second of night elapsed
    baseRadius: 70,             // px of light with no energy and no swarm
    radiusPerEnergy: 1.7,
    radiusPerFollower: 7,
    lightReach: 0.92,           // fraction of the light radius that affects Shadows

    // Player and swarm
    playerSpeed: 270,           // px/s
    steerGain: 3.5,             // pointer steering: speed = min(playerSpeed, distance × gain)
    maxFollowers: 12,

    // Collectibles
    pollenEnergy: 8,
    pollenMax: 14,
    pollenPoints: 10,
    pollenPointsPerFollower: 0.25,
    comboBonus: 0.1,            // +10% pollen points per step of combo
    lostEnergy: 18,
    dewEnergy: 15,
    dewFirst: 28,               // the first Moon dew appears after 28 seconds
    dewInterval: [ 35, 50 ],
    dewLifetime: 12,

    // Flash and Radiance
    flashCost: 18,
    flashMin: 22,
    flashRange: 300,
    flashCooldown: 1.1,
    splendorDuration: 7,        // seconds of Radiance after collecting Moon dew
    splendorFade: 0.5,          // seconds over which Radiance fades out
    splendorRadius: 0.5,        // +50% light radius during Radiance
    splendorBurn: 2.5,          // Shadows burn 2.5 times faster

    // Shadow population
    maxShadows: 12,             // hard cap (waves may exceed it)...
    shadowCapBase: 5,           // ...reached from this starting cap...
    shadowCapPerSecond: 1 / 15, // ...growing by one Shadow every 15 seconds
    spawnIntervalStart: 3.2,    // seconds between spawns at dusk...
    spawnIntervalDecay: 0.02,   // ...shrinking by this much per second of night...
    spawnIntervalMin: 0.9,      // ...down to this minimum
    spawnJitter: 0.2,           // ±20% randomness on each interval
    doubleSpawnFrom: 60,        // after this many seconds a spawn may bring a second Shadow...
    doubleSpawnChance: 0.3,     // ...with this probability
    shadowHaste: 0.35,          // px/s gained per second of night (not by the Colossus)
    shadowSpeedCap: 1.9,        // max speed, as a multiple of the kind's top base speed
    shadeGrowthPerSecond: 1 / 300, // common Shadows get bigger over the night...
    shadeGrowthMax: 0.5,        // ...up to this extra size
    mothFrom: 25,               // Moths start appearing after 25 seconds...
    mothRamp: 100,              // ...their share grows over 100 seconds...
    mothChanceMax: 0.3,         // ...up to 30% of spawns
    waves: [ 45, 95, 128 ],     // seconds at which a wave of Shadows arrives
    waveBaseSize: 3,
    waveGrowth: 2,              // extra Shadows in each following wave
    colossusFrom: 70,
    colossusInterval: 40,
    colossusDimRange: 260,      // within this distance the Colossus dims the light
    colossusDim: 0.35,          // up to -35% of the radius

    // Burning in the light: damage/s = (burnBase + burnHeat × closeness) × (1 + burnPerFollower × swarm)
    burnBase: 0.25,
    burnHeat: 1.1,
    burnPerFollower: 0.06,

    // Dawn bonus
    dawnBonusPerFollower: 100,
    dawnBonusPerEnergy: 5
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
