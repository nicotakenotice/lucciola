import { Math as PMath } from 'phaser';
import { HEIGHT, WIDTH } from './constants';
import type { Point } from './types';

// Draw order of the world layers: everything under DARKNESS is visible only inside the light
export const DEPTH = {
    shadows: 5,
    spores: 8,
    bugs: 10,
    darkness: 100,
    lights: 110,
    effects: 190
} as const;

// The top band of the screen is covered by the HUD: collectibles stay below it
export const HUD_BAND = 125;
export const MARGIN = 40;

export function randomSpot (avoid: Point, minDistance: number): Point
{
    const roll = () => ({ x: PMath.Between(MARGIN, WIDTH - MARGIN), y: PMath.Between(HUD_BAND, HEIGHT - MARGIN) });

    for (let attempt = 0; attempt < 20; attempt++)
    {
        const spot = roll();
        if (Math.hypot(spot.x - avoid.x, spot.y - avoid.y) > minDistance) return spot;
    }

    return roll();
}
