import { describe, expect, it } from 'vitest';
import { SHADOWS, TUNING as T } from './constants';
import * as rules from './rules';

const fixed = (value: number): rules.Random => () => value;
const noLight = { energy: 0, followers: 0, radiance: 0, dim: 1, scale: 1 };

describe('light', () =>
{
    it('grows with energy and swarm', () =>
    {
        expect(rules.lightRadius(noLight)).toBe(T.baseRadius);
        expect(rules.lightRadius({ ...noLight, energy: 100 })).toBe(T.baseRadius + 100 * T.radiusPerEnergy);
        expect(rules.lightRadius({ ...noLight, followers: 3 })).toBe(T.baseRadius + 3 * T.radiusPerFollower);
    });

    it('ignores negative energy', () =>
    {
        expect(rules.lightRadius({ ...noLight, energy: -40 })).toBe(T.baseRadius);
    });

    it('is widened by Radiance and shrunk by a Colossus and by the end of the night', () =>
    {
        const base = rules.lightRadius({ ...noLight, energy: 50 });
        expect(rules.lightRadius({ ...noLight, energy: 50, radiance: T.radianceDuration })).toBeCloseTo(base * (1 + T.radianceRadius));
        expect(rules.lightRadius({ ...noLight, energy: 50, dim: 0.5 })).toBeCloseTo(base / 2);
        expect(rules.lightRadius({ ...noLight, energy: 50, scale: 0 })).toBe(0);
    });

    it('fades Radiance out over its last moments', () =>
    {
        expect(rules.radianceFactor(0)).toBe(0);
        expect(rules.radianceFactor(T.radianceFade / 2)).toBeCloseTo(0.5);
        expect(rules.radianceFactor(T.radianceDuration)).toBe(1);
    });

    it('drains faster as the night goes on', () =>
    {
        expect(rules.energyDecayRate(0)).toBe(T.energyDecay);
        expect(rules.energyDecayRate(100)).toBeGreaterThan(rules.energyDecayRate(0));
    });
});

describe('shadow population', () =>
{
    it('starts with a small cap and never exceeds the hard cap', () =>
    {
        expect(rules.shadowCap(0)).toBe(T.shadowCapBase);
        expect(rules.shadowCap(10_000)).toBe(T.maxShadows);
    });

    it('spawns more often later, within the jitter range and above the minimum', () =>
    {
        expect(rules.spawnInterval(0, fixed(0.5))).toBeCloseTo(T.spawnIntervalStart);
        expect(rules.spawnInterval(0, fixed(0))).toBeCloseTo(T.spawnIntervalStart * (1 - T.spawnJitter));
        expect(rules.spawnInterval(10_000, fixed(0.5))).toBeCloseTo(T.spawnIntervalMin);
    });

    it('allows a second Shadow per spawn only later in the night', () =>
    {
        expect(rules.spawnsTwo(T.doubleSpawnFrom - 1, fixed(0))).toBe(false);
        expect(rules.spawnsTwo(T.doubleSpawnFrom + 1, fixed(0))).toBe(true);
        expect(rules.spawnsTwo(T.doubleSpawnFrom + 1, fixed(0.99))).toBe(false);
    });

    it('introduces Moths gradually and caps their share', () =>
    {
        expect(rules.mothChance(T.mothFrom)).toBe(0);
        expect(rules.mothChance(T.mothFrom + T.mothRamp / 10)).toBeCloseTo(0.1);
        expect(rules.mothChance(10_000)).toBe(T.mothChanceMax);
    });

    it('picks a Colossus only when ready and late enough', () =>
    {
        expect(rules.pickShadowKind(T.colossusFrom + 1, true, fixed(0.99))).toBe('colossus');
        expect(rules.pickShadowKind(T.colossusFrom - 1, true, fixed(0.99))).toBe('shade');
        expect(rules.pickShadowKind(T.colossusFrom + 1, false, fixed(0.99))).toBe('shade');
        expect(rules.pickShadowKind(10_000, false, fixed(0))).toBe('moth');
    });

    it('grows common Shadows over the night and keeps the Colossus slow', () =>
    {
        const early = rules.rollShadow('shade', 0, fixed(0));
        const late = rules.rollShadow('shade', 10_000, fixed(0));
        expect(early.size).toBe(SHADOWS.shade.size[0]);
        expect(late.size).toBeCloseTo(SHADOWS.shade.size[0] + T.shadeGrowthMax);
        expect(late.hp).toBeCloseTo(SHADOWS.shade.hp * late.size);
        expect(late.speed).toBe(SHADOWS.shade.speed[1] * T.shadowSpeedCap);

        const colossus = rules.rollShadow('colossus', 10_000, fixed(1));
        expect(colossus.speed).toBe(SHADOWS.colossus.speed[1]);
        expect(colossus.hp).toBe(SHADOWS.colossus.hp);
    });

    it('builds bigger waves, with Moths from the second one', () =>
    {
        expect(rules.waveSize(0)).toBe(T.waveBaseSize);
        expect(rules.waveSize(2)).toBe(T.waveBaseSize + 2 * T.waveGrowth);
        expect([ 0, 1, 2 ].map((i) => rules.waveMemberKind(0, i))).toEqual([ 'shade', 'shade', 'shade' ]);
        expect([ 0, 1, 2 ].map((i) => rules.waveMemberKind(1, i))).toEqual([ 'shade', 'shade', 'moth' ]);
    });
});

describe('light versus Shadows', () =>
{
    it('reaches Shadows only inside most of the radius', () =>
    {
        expect(rules.isInLight(100, 200)).toBe(true);
        expect(rules.isInLight(199, 200)).toBe(false);
    });

    it('burns closer Shadows faster, more with a swarm and much more with Radiance', () =>
    {
        const far = rules.burnRate(180, 200, 0, 'shade', 0);
        const near = rules.burnRate(20, 200, 0, 'shade', 0);
        expect(near).toBeGreaterThan(far);
        expect(rules.burnRate(20, 200, 10, 'shade', 0)).toBeGreaterThan(near);
        expect(rules.burnRate(20, 200, 0, 'shade', T.radianceDuration)).toBeCloseTo(near * T.radianceBurn);
        expect(rules.burnRate(20, 200, 0, 'colossus', 0)).toBeLessThan(near);
    });

    it('dims the light near a Colossus', () =>
    {
        expect(rules.colossusDim(T.colossusDimRange)).toBe(1);
        expect(rules.colossusDim(0)).toBeCloseTo(1 - T.colossusDim);
    });
});

describe('scoring and movement', () =>
{
    it('rewards pollen more with a swarm and a combo', () =>
    {
        expect(rules.pollenPoints(0, 0)).toBe(T.pollenPoints);
        expect(rules.pollenPoints(4, 0)).toBeGreaterThan(T.pollenPoints);
        expect(rules.pollenPoints(0, 5)).toBeGreaterThan(T.pollenPoints);
    });

    it('gives a dawn bonus for the swarm and the light left', () =>
    {
        expect(rules.dawnBonus(3, 40.4)).toBe(3 * T.dawnBonusPerFollower + 40 * T.dawnBonusPerEnergy);
    });

    it('slows down when close to the steering target and caps the speed', () =>
    {
        expect(rules.steeringSpeed(10)).toBe(10 * T.steerGain);
        expect(rules.steeringSpeed(10_000)).toBe(T.playerSpeed);
    });
});
