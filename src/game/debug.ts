import type { ShadowKind } from './constants';
import type { GameStats } from './events';
import type { Point, RunState } from './types';

// Stable surface used by end-to-end tests and the balance bot. The scene internals can change freely
// as long as this contract holds.

export interface GameSnapshot
{
    state: RunState;
    paused: boolean;
    energy: number;
    elapsed: number;
    score: number;
    followers: number;
    flashCooldown: number;
    player: Point;
    shadows: (Point & { kind: ShadowKind })[];
    pollen: Point[];
    lost: Point[];
    dew: Point | null;
    stats: GameStats;
}

export interface GameDebugApi
{
    snapshot (): GameSnapshot;
    set (values: Partial<{ energy: number; elapsed: number }>): void;
    spawnShadow (kind: ShadowKind, at?: Point): void;
    spawn (kind: 'pollen' | 'lost' | 'dew', at: Point): void;
    // Moves the firefly towards a point instead of the pointer; `null` gives control back
    steerTo (target: Point | null): void;
    flash (): void;
}
