import { BlendModes, GameObjects, Math as PMath, Scene } from 'phaser';
import { TEXTURES } from '../textures';
import type { Point } from '../types';
import { DEPTH } from '../layout';

interface Follower extends Point
{
    phase: number;
    pulse: number;
    bug: GameObjects.Image;
    glow: GameObjects.Image;
}

const SPACING = 7;          // path points between two followers

// Rescued fireflies trailing behind the player along its path
export class Swarm
{
    private readonly followers: Follower[] = [];

    constructor (private readonly scene: Scene)
    {
    }

    get size ()
    {
        return this.followers.length;
    }

    get members (): readonly (Point & { pulse: number })[]
    {
        return this.followers;
    }

    add (x: number, y: number)
    {
        this.followers.push({
            x,
            y,
            phase: Math.random() * Math.PI * 2,
            pulse: 1,
            bug: this.scene.add.image(x, y, TEXTURES.bug).setDepth(DEPTH.bugs).setScale(0.8),
            glow: this.scene.add.image(x, y, TEXTURES.glow).setDepth(DEPTH.lights).setBlendMode(BlendModes.ADD).setTint(0x9dffcf)
        });
    }

    // Removes the last follower and returns where it was
    sacrifice (): Point | null
    {
        const follower = this.followers.pop();
        if (!follower) return null;

        follower.bug.destroy();
        follower.glow.destroy();

        return { x: follower.x, y: follower.y };
    }

    // The swarm flies off and fades when the night is lost
    scatter ()
    {
        for (const f of this.followers)
        {
            this.scene.tweens.add({
                targets: [ f.bug, f.glow ],
                alpha: 0,
                x: f.x + PMath.Between(-200, 200),
                y: f.y + PMath.Between(-200, 200),
                duration: 1600
            });
        }
    }

    update (dt: number, time: number, path: readonly Point[], lightScale: number)
    {
        const blend = 1 - Math.exp(-dt * 5);
        this.followers.forEach((f, i) =>
        {
            const anchor = path[Math.min(path.length - 1, (i + 1) * SPACING)];
            const wobble = time * 0.003 + f.phase;
            const tx = anchor.x + Math.cos(wobble) * 12;
            const ty = anchor.y + Math.sin(wobble * 1.3) * 12;
            const nx = f.x + (tx - f.x) * blend;
            const ny = f.y + (ty - f.y) * blend;
            if (Math.hypot(nx - f.x, ny - f.y) > 0.3)
            {
                f.bug.rotation = PMath.Angle.RotateTo(f.bug.rotation, Math.atan2(ny - f.y, nx - f.x) + Math.PI / 2, dt * 10);
            }
            f.x = nx;
            f.y = ny;
            f.pulse = 0.6 + 0.4 * Math.sin(time * 0.004 + f.phase);
            f.bug.setPosition(f.x, f.y);
            f.bug.scaleX = 0.8 + Math.sin(time * 0.05 + f.phase) * 0.1;
            f.glow.setPosition(f.x, f.y).setAlpha(f.pulse * lightScale).setScale(0.5 + f.pulse * 0.25);
        });
    }
}
