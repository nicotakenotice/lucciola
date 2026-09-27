import { BlendModes, GameObjects, Scene } from 'phaser';
import { TEXTURES } from '../textures';
import { TUNING as T } from '../constants';
import type { Point } from '../types';
import { DEPTH } from '../layout';

interface Pollen extends Point
{
    phase: number;
    glow: GameObjects.Image;
    core: GameObjects.Image;
}

export class PollenField
{
    private readonly items: Pollen[] = [];

    constructor (private readonly scene: Scene)
    {
    }

    get count ()
    {
        return this.items.length;
    }

    get positions (): readonly Point[]
    {
        return this.items;
    }

    spawn ({ x, y }: Point)
    {
        const add = this.scene.add;
        const glow = add.image(x, y, TEXTURES.glow).setDepth(DEPTH.lights).setBlendMode(BlendModes.ADD).setTint(0xfff27a).setScale(0);
        const core = add.image(x, y, TEXTURES.dot).setDepth(DEPTH.lights + 1).setTint(0xfffbe0).setScale(0);
        this.scene.tweens.add({ targets: glow, scale: 0.55, duration: 500, ease: 'Back.easeOut' });
        this.scene.tweens.add({ targets: core, scale: 0.6, duration: 500, ease: 'Back.easeOut' });
        this.items.push({ x, y, glow, core, phase: Math.random() * 10 });
    }

    // Light pulls in nearby pollen; returns where pollen was collected this frame
    update (dt: number, time: number, player: Point, lightRadius: number, alive: boolean): Point[]
    {
        const collected: Point[] = [];
        const pullRange = lightRadius * T.pollenPullReach;
        const [ slowPull, fastPull ] = T.pollenPullSpeed;

        for (let i = this.items.length - 1; i >= 0; i--)
        {
            const pollen = this.items[i];
            const dx = player.x - pollen.x;
            const dy = player.y - pollen.y;
            const d = Math.hypot(dx, dy);

            if (alive && d < pullRange && d > 1)
            {
                const pull = slowPull + (fastPull - slowPull) * (1 - d / pullRange);
                pollen.x += (dx / d) * pull * dt;
                pollen.y += (dy / d) * pull * dt;
            }

            const bob = Math.sin(time * 0.003 + pollen.phase) * 2;
            pollen.glow.setPosition(pollen.x, pollen.y + bob).setAlpha(0.7 + Math.sin(time * 0.005 + pollen.phase) * 0.3);
            pollen.core.setPosition(pollen.x, pollen.y + bob);

            if (alive && d < T.pollenPickupRadius)
            {
                this.items.splice(i, 1);
                pollen.glow.destroy();
                pollen.core.destroy();
                collected.push({ x: pollen.x, y: pollen.y });
            }
        }

        return collected;
    }
}
