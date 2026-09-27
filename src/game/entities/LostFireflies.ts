import { BlendModes, GameObjects, Math as PMath, Scene } from 'phaser';
import { TEXTURES } from '../textures';
import { HEIGHT, WIDTH } from '../constants';
import type { Point } from '../types';
import { DEPTH, HUD_BAND, MARGIN } from '../layout';

interface LostFly extends Point
{
    angle: number;
    phase: number;
    on: number;             // 0..1 brightness of the current blink
    bug: GameObjects.Image;
    glow: GameObjects.Image;
}

const RESCUE_DISTANCE = 28;
const SPEED = 45;

// Fireflies wandering in the dark, waiting to be rescued (or devoured by Shadows)
export class LostFireflies
{
    private readonly items: LostFly[] = [];

    constructor (private readonly scene: Scene)
    {
    }

    get count ()
    {
        return this.items.length;
    }

    get members (): readonly (Point & { on: number })[]
    {
        return this.items;
    }

    spawn ({ x, y }: Point)
    {
        this.items.push({
            x,
            y,
            angle: Math.random() * Math.PI * 2,
            phase: Math.random() * 2,
            on: 0,
            bug: this.scene.add.image(x, y, TEXTURES.bug).setDepth(DEPTH.bugs).setScale(0.8),
            glow: this.scene.add.image(x, y, TEXTURES.glow).setDepth(DEPTH.lights).setBlendMode(BlendModes.ADD).setTint(0x7dfcff)
        });
    }

    // Returns where fireflies were rescued this frame
    update (dt: number, time: number, player: Point, alive: boolean): Point[]
    {
        const rescued: Point[] = [];

        for (let i = this.items.length - 1; i >= 0; i--)
        {
            const fly = this.items[i];
            fly.angle += Math.sin(time * 0.0013 + fly.phase * 3) * 2 * dt;
            fly.x += Math.cos(fly.angle) * SPEED * dt;
            fly.y += Math.sin(fly.angle) * SPEED * dt;
            if (fly.x < MARGIN || fly.x > WIDTH - MARGIN) fly.angle = Math.PI - fly.angle;
            if (fly.y < HUD_BAND || fly.y > HEIGHT - MARGIN) fly.angle = -fly.angle;
            fly.x = PMath.Clamp(fly.x, MARGIN, WIDTH - MARGIN);
            fly.y = PMath.Clamp(fly.y, HUD_BAND, HEIGHT - MARGIN);

            // Blinks like a real firefly: one signal every 1.6 seconds
            const lit = (time * 0.001 + fly.phase) % 1.6 < 0.55;
            fly.on += ((lit ? 1 : 0.12) - fly.on) * (1 - Math.exp(-dt * 12));
            fly.bug.setPosition(fly.x, fly.y).setRotation(fly.angle + Math.PI / 2);
            fly.bug.scaleX = 0.8 + Math.sin(time * 0.05 + fly.phase) * 0.1;
            fly.glow.setPosition(fly.x, fly.y).setAlpha(fly.on).setScale(0.6 + fly.on * 0.9);

            if (alive && Math.hypot(player.x - fly.x, player.y - fly.y) < RESCUE_DISTANCE)
            {
                rescued.push(this.remove(i));
            }
        }

        return rescued;
    }

    // Removes the fireflies within `radius` of a point and returns where they were
    devour (x: number, y: number, radius: number): Point[]
    {
        const eaten: Point[] = [];
        for (let i = this.items.length - 1; i >= 0; i--)
        {
            const fly = this.items[i];
            if (Math.hypot(fly.x - x, fly.y - y) < radius) eaten.push(this.remove(i));
        }

        return eaten;
    }

    private remove (index: number): Point
    {
        const [ fly ] = this.items.splice(index, 1);
        fly.bug.destroy();
        fly.glow.destroy();

        return { x: fly.x, y: fly.y };
    }
}
