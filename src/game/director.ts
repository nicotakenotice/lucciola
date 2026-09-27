import { ShadowKind, TUNING as T } from './constants';
import * as rules from './rules';
import type { Random } from './rules';

export type SpawnRequest =
    | { type: 'pollen' }
    | { type: 'lost' }
    | { type: 'dew' }
    | { type: 'shadow'; kind: ShadowKind }
    | { type: 'wave'; index: number };

export interface WorldCounts
{
    pollen: number;
    lost: number;
    swarm: number;
    shadows: number;
    dewPresent: boolean;
    colossusPresent: boolean;
}

// Decides what appears during the night and when. Pure: the scene executes the requests.
export class NightDirector
{
    private pollenTimer: number = 0;
    private lostTimer: number = T.lostFirst;
    private dewTimer: number = T.dewFirst;
    private shadowTimer: number = T.shadowFirst;
    private colossusTimer: number = 0;
    private nextWave: number = 0;

    constructor (private readonly random: Random = Math.random)
    {
    }

    update (dt: number, elapsed: number, world: WorldCounts): SpawnRequest[]
    {
        const requests: SpawnRequest[] = [];

        this.pollenTimer -= dt;
        if (this.pollenTimer <= 0)
        {
            if (world.pollen < T.pollenMax) requests.push({ type: 'pollen' });
            this.pollenTimer = this.between(T.pollenInterval[0], T.pollenInterval[1]);
        }

        this.lostTimer -= dt;
        if (this.lostTimer <= 0)
        {
            if (world.lost < T.lostMax && world.swarm < T.maxFollowers) requests.push({ type: 'lost' });
            this.lostTimer = this.between(T.lostInterval[0], T.lostInterval[1]);
        }

        this.dewTimer -= dt;
        if (this.dewTimer <= 0 && !world.dewPresent)
        {
            requests.push({ type: 'dew' });
            this.dewTimer = this.between(T.dewInterval[0], T.dewInterval[1]);
        }

        this.colossusTimer -= dt;
        this.shadowTimer -= dt;
        if (this.shadowTimer <= 0)
        {
            // Waves may exceed the cap; regular spawns never do
            const cap = rules.shadowCap(elapsed);
            let shadows = world.shadows;
            let colossusPresent = world.colossusPresent;
            const spawn = () =>
            {
                const kind = rules.pickShadowKind(elapsed, this.colossusTimer <= 0 && !colossusPresent, this.random);
                if (kind === 'colossus')
                {
                    this.colossusTimer = T.colossusInterval;
                    colossusPresent = true;
                }
                shadows++;
                requests.push({ type: 'shadow', kind });
            };

            if (shadows < cap) spawn();
            if (rules.spawnsTwo(elapsed, this.random) && shadows < cap) spawn();
            this.shadowTimer = rules.spawnInterval(elapsed, this.random);
        }

        if (this.nextWave < T.waves.length && elapsed >= T.waves[this.nextWave])
        {
            requests.push({ type: 'wave', index: this.nextWave });
            this.nextWave++;
        }

        return requests;
    }

    private between (min: number, max: number)
    {
        return min + (max - min) * this.random();
    }
}
