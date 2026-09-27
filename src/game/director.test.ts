import { describe, expect, it } from 'vitest';
import { TUNING as T } from './constants';
import { NightDirector, SpawnRequest, WorldCounts } from './director';

const empty: WorldCounts = { pollen: 0, lost: 0, swarm: 0, shadows: 0, dewPresent: false, colossusPresent: false };
const types = (requests: SpawnRequest[]) => requests.map((r) => r.type);

// Runs the director for `seconds` in fixed steps, collecting every request
function run (director: NightDirector, from: number, seconds: number, world: WorldCounts = empty, step = 0.1)
{
    const requests: SpawnRequest[] = [];
    for (let t = from; t < from + seconds; t += step) requests.push(...director.update(step, t, world));

    return requests;
}

describe('NightDirector', () =>
{
    it('asks for pollen right away and keeps it coming, up to the maximum', () =>
    {
        const director = new NightDirector(() => 0.5);
        expect(types(director.update(0.1, 0, empty))).toContain('pollen');
        expect(run(director, 0.1, 10).filter((r) => r.type === 'pollen').length).toBeGreaterThan(5);

        const full = new NightDirector(() => 0.5);
        expect(run(full, 0, 10, { ...empty, pollen: T.pollenMax }).some((r) => r.type === 'pollen')).toBe(false);
    });

    it('sends lost fireflies only while the swarm and the dark have room', () =>
    {
        expect(run(new NightDirector(() => 0.5), 0, 30).some((r) => r.type === 'lost')).toBe(true);
        expect(run(new NightDirector(() => 0.5), 0, 30, { ...empty, swarm: T.maxFollowers }).some((r) => r.type === 'lost')).toBe(false);
        expect(run(new NightDirector(() => 0.5), 0, 30, { ...empty, lost: 2 }).some((r) => r.type === 'lost')).toBe(false);
    });

    it('brings the first Moon dew after the configured delay, one at a time', () =>
    {
        const director = new NightDirector(() => 0.5);
        expect(run(director, 0, T.dewFirst - 1).some((r) => r.type === 'dew')).toBe(false);
        expect(run(director, T.dewFirst - 1, 2).filter((r) => r.type === 'dew')).toHaveLength(1);
        expect(run(new NightDirector(() => 0.5), 0, 60, { ...empty, dewPresent: true }).some((r) => r.type === 'dew')).toBe(false);
    });

    it('never exceeds the Shadow cap with regular spawns', () =>
    {
        const atCap = run(new NightDirector(() => 0), 0, 60, { ...empty, shadows: T.maxShadows });
        expect(atCap.some((r) => r.type === 'shadow')).toBe(false);

        // The cap starts at shadowCapBase and grows with the night
        const early = run(new NightDirector(() => 0), 0, 3, { ...empty, shadows: T.shadowCapBase - 1 });
        expect(early.filter((r) => r.type === 'shadow').length).toBeGreaterThan(0);
    });

    it('announces each wave once, at its time', () =>
    {
        const director = new NightDirector(() => 0.5);
        const waves = run(director, 0, T.nightLength, { ...empty, shadows: 99 }).filter((r) => r.type === 'wave');
        expect(waves).toEqual(T.waves.map((_, index) => ({ type: 'wave', index })));
    });

    it('sends at most one Colossus while one is present, and waits for the cooldown', () =>
    {
        const director = new NightDirector(() => 0.99);
        const late = run(director, T.colossusFrom + 1, 30, { ...empty, colossusPresent: false });
        const colossi = late.filter((r) => r.type === 'shadow' && r.kind === 'colossus');
        expect(colossi).toHaveLength(1);

        const blocked = new NightDirector(() => 0.99);
        const withOne = run(blocked, T.colossusFrom + 1, 30, { ...empty, colossusPresent: true });
        expect(withOne.some((r) => r.type === 'shadow' && r.kind === 'colossus')).toBe(false);
    });
});
