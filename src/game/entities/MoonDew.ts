import { BlendModes, GameObjects, Scene } from 'phaser';
import { TUNING as T } from '../constants';
import type { Point } from '../debug';
import { DEPTH } from '../layout';

interface Drop extends Point
{
    life: number;
    glow: GameObjects.Image;
    core: GameObjects.Image;
    ring: GameObjects.Image;
}

const PICKUP_DISTANCE = 28;
const WARNING_TIME = 3;

// The rare Moon dew power-up: at most one on screen, vanishing after a while
export class MoonDew
{
    private drop: Drop | null = null;

    constructor (private readonly scene: Scene)
    {
    }

    get present ()
    {
        return this.drop !== null;
    }

    get light (): (Point & { alpha: number }) | null
    {
        return this.drop && { x: this.drop.x, y: this.drop.y, alpha: this.drop.glow.alpha };
    }

    spawn ({ x, y }: Point)
    {
        const add = this.scene.add;
        const glow = add.image(x, y, 'glow').setDepth(DEPTH.lights).setBlendMode(BlendModes.ADD).setTint(0xbfe8ff).setScale(0);
        const core = add.image(x, y, 'dot').setDepth(DEPTH.lights + 1).setTint(0xffffff).setScale(0);
        const ring = add.image(x, y, 'ring').setDepth(DEPTH.lights).setBlendMode(BlendModes.ADD).setTint(0xbfe8ff).setScale(0);
        this.scene.tweens.add({ targets: [ glow, core ], scale: 1, duration: 700, ease: 'Back.easeOut' });
        this.drop = { x, y, glow, core, ring, life: T.dewLifetime };
    }

    // Returns where the drop was collected, or null
    update (dt: number, time: number, player: Point, alive: boolean): Point | null
    {
        const drop = this.drop;
        if (!drop) return null;

        drop.life -= dt;
        const fading = drop.life < WARNING_TIME ? (Math.sin(time * 0.03) > 0 ? 1 : 0.25) : 1;
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.006);
        const ripple = (time * 0.001) % 1;
        drop.glow.setAlpha(fading).setScale(1 + pulse * 0.4);
        drop.core.setAlpha(fading).setScale(0.8 + pulse * 0.3);
        drop.ring.setAlpha(fading * (1 - ripple)).setScale(0.2 + ripple * 0.5);

        if (alive && Math.hypot(player.x - drop.x, player.y - drop.y) < PICKUP_DISTANCE)
        {
            this.drop = null;
            this.destroy(drop);

            return { x: drop.x, y: drop.y };
        }

        if (drop.life <= 0 || !alive)
        {
            this.drop = null;
            this.scene.tweens.add({
                targets: [ drop.glow, drop.core, drop.ring ],
                alpha: 0,
                scale: 0,
                duration: 400,
                onComplete: () => this.destroy(drop)
            });
        }

        return null;
    }

    private destroy (drop: Drop)
    {
        [ drop.glow, drop.core, drop.ring ].forEach((sprite) => sprite.destroy());
    }
}
