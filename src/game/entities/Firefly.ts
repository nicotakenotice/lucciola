import { BlendModes, Display, GameObjects, Math as PMath, Scene } from 'phaser';
import { TEXTURES } from '../textures';
import { HEIGHT, WIDTH } from '../constants';
import type { Point } from '../types';
import { DEPTH } from '../layout';

const EDGE = 12;
const PATH_STEP = 3;        // px between two recorded points of the path
const PATH_LENGTH = 200;
const ACCELERATION = 7;     // how quickly the velocity reaches the desired one

export interface GlowState
{
    energy: number;
    radiance: number;       // 0..1 Radiance factor
    lowLight: boolean;
    scale: number;
}

// The player's firefly: movement, the path the swarm follows and the glow sprite
export class Firefly
{
    readonly position: Point = { x: WIDTH / 2, y: HEIGHT / 2 };
    readonly sprite: GameObjects.Image;
    // Most recent point first; followers trail behind along it
    readonly path: Point[];

    private readonly velocity: Point = { x: 0, y: 0 };
    private readonly glow: GameObjects.Image;

    constructor (scene: Scene)
    {
        const { x, y } = this.position;
        this.path = Array.from({ length: 120 }, () => ({ x, y }));
        this.sprite = scene.add.image(x, y, TEXTURES.bug).setDepth(DEPTH.bugs + 1);
        this.glow = scene.add.image(x, y, TEXTURES.glow).setDepth(DEPTH.lights).setBlendMode(BlendModes.ADD).setTint(0xe4ff7a);
    }

    update (dt: number, time: number, desired: Point, glow: GlowState)
    {
        const p = this.position;
        const v = this.velocity;
        const blend = 1 - Math.exp(-dt * ACCELERATION);
        v.x += (desired.x - v.x) * blend;
        v.y += (desired.y - v.y) * blend;
        p.x = PMath.Clamp(p.x + v.x * dt, EDGE, WIDTH - EDGE);
        p.y = PMath.Clamp(p.y + v.y * dt, EDGE, HEIGHT - EDGE);

        const last = this.path[0];
        if (Math.hypot(p.x - last.x, p.y - last.y) > PATH_STEP)
        {
            this.path.unshift({ x: p.x, y: p.y });
            if (this.path.length > PATH_LENGTH) this.path.pop();
        }

        if (Math.hypot(v.x, v.y) > 10)
        {
            const heading = Math.atan2(v.y, v.x) + Math.PI / 2;
            this.sprite.rotation = PMath.Angle.RotateTo(this.sprite.rotation, heading, dt * 12);
        }
        this.sprite.setPosition(p.x, p.y + Math.sin(time * 0.006) * 1.5);
        this.sprite.scaleX = 1 + Math.sin(time * 0.06) * 0.12;

        // With little light the glow pulses like a heartbeat; during Radiance it turns bluish white
        const e = PMath.Clamp(glow.energy / 100, 0, 1);
        const rad = glow.radiance;
        const heartbeat = glow.lowLight ? Math.max(0, Math.sin(time * 0.012)) * 0.25 : 0;
        this.glow
            .setPosition(p.x, p.y)
            .setScale((0.7 + e * 0.7 + rad * 0.6 + heartbeat + Math.sin(time * 0.008) * 0.05) * glow.scale)
            .setAlpha(0.5 + e * 0.5)
            .setTint(rad > 0 ? Display.Color.GetColor(228 - rad * 10, 255, 122 + rad * 133) : 0xe4ff7a);
    }
}
