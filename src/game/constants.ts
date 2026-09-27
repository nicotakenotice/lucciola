export const WIDTH = 1280;
export const HEIGHT = 720;

export const FONT_UI = '"Quicksand", "Trebuchet MS", sans-serif';

export const TUNING = {
    // Night and light
    nightLength: 150,           // seconds until dawn
    maxEnergy: 100,
    lowLight: 25,               // heartbeat, pulsing glow and red HUD vignette below this
    lowLightWarning: 30,        // first-night hint and tense music below this
    energyDecay: 3.0,           // light lost per second...
    energyDecayGrowth: 0.004,   // ...plus this amount for every second of night elapsed
    baseRadius: 70,             // px of light with no energy and no swarm
    radiusPerEnergy: 1.7,
    radiusPerFollower: 7,
    lightReach: 0.92,           // fraction of the light radius that affects Shadows

    // Player and swarm
    playerSpeed: 270,           // px/s
    steerGain: 3.5,             // pointer steering: speed = min(playerSpeed, distance × gain)
    maxFollowers: 12,

    // Collectibles (distances in px)
    pollenEnergy: 8,
    pollenMax: 14,
    pollenAtStart: 6,
    pollenInterval: [ 0.8, 1.6 ],
    pollenSpawnDistance: 140,   // minimum distance from the player when spawning
    pollenPickupRadius: 22,
    pollenPullReach: 0.5,       // pollen within this fraction of the light radius drifts to the player...
    pollenPullSpeed: [ 40, 200 ], // ...from this speed at the edge to this one close by (px/s)
    pollenPoints: 10,
    pollenPointsPerFollower: 0.25,
    comboBonus: 0.1,            // +10% pollen points per step of combo
    comboWindow: 1.4,           // seconds between pickups to keep a combo going
    lostEnergy: 18,
    lostMax: 2,
    lostFirst: 5,
    lostInterval: [ 9, 14 ],
    lostSpawnDistance: 300,
    rescueRadius: 28,
    rescuePoints: 50,
    dewEnergy: 15,
    dewFirst: 28,               // the first Moon dew appears after 28 seconds
    dewInterval: [ 35, 50 ],
    dewLifetime: 12,
    dewSpawnDistance: 260,
    dewPickupRadius: 28,
    dewPoints: 40,

    // Flash and Radiance
    flashCost: 18,
    flashMin: 22,
    flashRange: 300,
    flashCooldown: 1.1,
    radianceDuration: 7,        // seconds of Radiance after collecting Moon dew
    radianceFade: 0.5,          // seconds over which Radiance fades out
    radianceRadius: 0.5,        // +50% light radius during Radiance
    radianceBurn: 2.5,          // Shadows burn 2.5 times faster

    // Shadow population
    shadowFirst: 3,             // seconds before the first Shadow
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
    waveSpacing: 0.26,          // seconds between two Shadows of the same wave
    colossusFrom: 70,
    colossusInterval: 40,
    colossusDimRange: 260,      // within this distance the Colossus dims the light
    colossusDim: 0.35,          // up to -35% of the radius

    // Shadow behaviour
    contactRadius: 16,          // a Shadow touches the player within contactRadius + contactPerSize × size
    contactPerSize: 12,
    devourPerSize: 18,          // radius × size within which a Shadow devours a lost firefly
    mothDashTime: 0.45,
    mothDashSpeedup: 2.3,
    mothDashRange: 380,         // Moths only dash when this close to the player
    colossusHitCooldown: 2.5,
    colossusBounce: 620,        // knockback after touching the player (px/s)
    flashWaveDuration: 0.4,     // seconds for the Flash to reach its full range
    flashColossusDamage: 3.5,
    flashColossusPush: 380,

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
    shields: number;        // followers sacrificed to absorb one hit
    eye: number;
}

export const SHADOWS: Record<ShadowKind, ShadowSpec> = {
    shade: { hp: 2.2, speed: [ 55, 80 ], size: [ 0.8, 1.25 ], lightSlow: 0.62, burn: 1, points: 15, flashPoints: 25, hitEnergy: 26, shields: 1, eye: 0xff5a6e },
    moth: { hp: 0.9, speed: [ 105, 130 ], size: [ 0.55, 0.7 ], lightSlow: 0.8, burn: 1.2, points: 20, flashPoints: 30, hitEnergy: 16, shields: 1, eye: 0xd98bff },
    colossus: { hp: 10, speed: [ 30, 38 ], size: [ 2.0, 2.3 ], lightSlow: 0.85, burn: 0.55, points: 120, flashPoints: 120, hitEnergy: 38, shields: 2, eye: 0xffa040 }
};
