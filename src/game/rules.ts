import { SHADOWS, ShadowKind, TUNING as T } from './constants';

// Pure game rules: no Phaser, no side effects. Randomness is injected so tests can be deterministic.

export type Random = () => number;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const between = (random: Random, min: number, max: number) => min + (max - min) * random();

export interface LightInput
{
    energy: number;
    followers: number;
    splendor: number;       // seconds of Radiance left
    dim: number;            // 0..1 multiplier from nearby Colossi
    scale: number;          // 0..1, shrinks the light when the night is lost
}

export function splendorFactor (splendorLeft: number): number
{
    return clamp(splendorLeft / T.splendorFade, 0, 1);
}

export function lightRadius ({ energy, followers, splendor, dim, scale }: LightInput): number
{
    const base = T.baseRadius + Math.max(0, energy) * T.radiusPerEnergy + followers * T.radiusPerFollower;

    return base * (1 + splendorFactor(splendor) * T.splendorRadius) * dim * scale;
}

export function energyDecayRate (elapsed: number): number
{
    return T.energyDecay + elapsed * T.energyDecayGrowth;
}

export function shadowCap (elapsed: number): number
{
    return Math.min(T.maxShadows, T.shadowCapBase + elapsed * T.shadowCapPerSecond);
}

export function spawnInterval (elapsed: number, random: Random = Math.random): number
{
    const interval = Math.max(T.spawnIntervalMin, T.spawnIntervalStart - elapsed * T.spawnIntervalDecay);

    return interval * between(random, 1 - T.spawnJitter, 1 + T.spawnJitter);
}

export function spawnsTwo (elapsed: number, random: Random = Math.random): boolean
{
    return elapsed > T.doubleSpawnFrom && random() < T.doubleSpawnChance;
}

export function mothChance (elapsed: number): number
{
    return clamp((elapsed - T.mothFrom) / T.mothRamp, 0, T.mothChanceMax);
}

// `colossusReady`: the Colossus cooldown is over and none is on screen
export function pickShadowKind (elapsed: number, colossusReady: boolean, random: Random = Math.random): ShadowKind
{
    if (colossusReady && elapsed > T.colossusFrom) return 'colossus';

    return random() < mothChance(elapsed) ? 'moth' : 'shade';
}

export interface ShadowStats
{
    size: number;
    hp: number;
    speed: number;
}

// Common Shadows grow and speed up as the night goes on; the Colossus stays slow on purpose
export function rollShadow (kind: ShadowKind, elapsed: number, random: Random = Math.random): ShadowStats
{
    const spec = SHADOWS[kind];
    const growth = kind === 'shade' ? Math.min(T.shadeGrowthMax, elapsed * T.shadeGrowthPerSecond) : 0;
    const haste = kind === 'colossus' ? 0 : elapsed * T.shadowHaste;
    const size = between(random, spec.size[0], spec.size[1]) + growth;

    return {
        size,
        hp: kind === 'shade' ? spec.hp * size : spec.hp,
        speed: Math.min(spec.speed[1] * T.shadowSpeedCap, between(random, spec.speed[0], spec.speed[1]) + haste)
    };
}

export function isInLight (distance: number, radius: number): boolean
{
    return distance < radius * T.lightReach;
}

// Damage per second a Shadow takes inside the light
export function burnRate (distance: number, radius: number, followers: number, kind: ShadowKind, splendorLeft: number): number
{
    const closeness = 1 - distance / radius;
    const radiance = 1 + splendorFactor(splendorLeft) * (T.splendorBurn - 1);

    return (T.burnBase + closeness * T.burnHeat) * (1 + followers * T.burnPerFollower) * SHADOWS[kind].burn * radiance;
}

// Light multiplier caused by a Colossus at `distance` from the player
export function colossusDim (distance: number): number
{
    if (distance >= T.colossusDimRange) return 1;

    return 1 - T.colossusDim * (1 - distance / T.colossusDimRange);
}

export function pollenPoints (followers: number, comboStep: number): number
{
    return Math.round(T.pollenPoints * (1 + followers * T.pollenPointsPerFollower) * (1 + comboStep * T.comboBonus));
}

export function dawnBonus (followers: number, energy: number): number
{
    return followers * T.dawnBonusPerFollower + Math.round(energy) * T.dawnBonusPerEnergy;
}

export function waveSize (index: number): number
{
    return T.waveBaseSize + index * T.waveGrowth;
}

// From the second wave on, every third Shadow is a Moth
export function waveMemberKind (waveIndex: number, memberIndex: number): ShadowKind
{
    return waveIndex > 0 && memberIndex % 3 === 2 ? 'moth' : 'shade';
}

export function steeringSpeed (distance: number): number
{
    return Math.min(T.playerSpeed, distance * T.steerGain);
}
