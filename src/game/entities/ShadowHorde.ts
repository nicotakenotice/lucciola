import { BlendModes, GameObjects, Math as PMath, Scene } from 'phaser';
import { TEXTURES } from '../textures';
import { HEIGHT, SHADOWS, ShadowKind, WIDTH } from '../constants';
import type { Point } from '../types';
import { DEPTH } from '../layout';
import * as rules from '../rules';
import type { Effects } from '../systems/Effects';
import { sfx } from '../../audio';

export interface Shadow extends Point
{
    kind: ShadowKind;
    size: number;
    hp: number;
    maxHp: number;
    speed: number;
    phase: number;
    lit: number;            // 0..1, eases in and out of the light
    blink: number;
    dash: number;           // Moths: >0 while dashing, <0 countdown to the next dash
    kvx: number;            // knockback velocity (Flash, impact)
    kvy: number;
    touchCd: number;        // Colossus: cooldown between two hits
    body: GameObjects.Image;
    body2: GameObjects.Image;
    eyeGlow: GameObjects.Image;
    eyeL: GameObjects.Image;
    eyeR: GameObjects.Image;
}

export interface HordeContext
{
    player: Point;
    lightRadius: number;
    alive: boolean;         // the night is being played
    nightLost: boolean;     // the light went out: Shadows close in slowly
    swarm: number;
    radiance: number;       // seconds of Radiance left
}

export interface Contact
{
    shadow: Shadow;
    distance: number;
}

const SPAWN_OFFSET = 60;    // px outside the screen
const MOTH_DASH_TIME = 0.45;
const MOTH_DASH_SPEEDUP = 2.3;
const MOTH_DASH_RANGE = 380;
const CLOSING_IN_SPEED = 0.35;
const KNOCKBACK_DAMPING = 4;
const COLOSSUS_HIT_COOLDOWN = 2.5;
const COLOSSUS_BOUNCE = 620;
const FLASH_WAVE_DURATION = 400;    // ms for the Flash to reach its full range
const FLASH_COLOSSUS_DAMAGE = 3.5;
const FLASH_COLOSSUS_PUSH = 380;

export class ShadowHorde
{
    private readonly shadows: Shadow[] = [];

    // `onDissolved` scores a Shadow destroyed by the light or a Flash
    constructor (
        private readonly scene: Scene,
        private readonly fx: Effects,
        private readonly onDissolved: (shadow: Shadow, points: number) => void
    )
    {
    }

    get count ()
    {
        return this.shadows.length;
    }

    get members (): readonly Shadow[]
    {
        return this.shadows;
    }

    has (kind: ShadowKind)
    {
        return this.shadows.some((s) => s.kind === kind);
    }

    // `side`: 0 left, 1 right, 2 top, 3 bottom
    spawn (kind: ShadowKind, elapsed: number, side = PMath.Between(0, 3)): Shadow
    {
        const spec = SHADOWS[kind];
        const x = side === 0 ? -SPAWN_OFFSET : side === 1 ? WIDTH + SPAWN_OFFSET : PMath.Between(0, WIDTH);
        const y = side === 2 ? -SPAWN_OFFSET : side === 3 ? HEIGHT + SPAWN_OFFSET : PMath.Between(0, HEIGHT);
        const { size, hp, speed } = rules.rollShadow(kind, elapsed);
        const add = this.scene.add;

        const shadow: Shadow = {
            kind,
            x,
            y,
            size,
            hp,
            maxHp: hp,
            speed,
            phase: Math.random() * 10,
            lit: 0,
            blink: PMath.FloatBetween(1, 4),
            dash: -PMath.FloatBetween(1.5, 3),
            kvx: 0,
            kvy: 0,
            touchCd: 0,
            body: add.image(x, y, TEXTURES.smoke).setDepth(DEPTH.shadows),
            body2: add.image(x, y, TEXTURES.smoke).setDepth(DEPTH.shadows),
            eyeGlow: add.image(x, y, TEXTURES.glow).setDepth(DEPTH.lights).setBlendMode(BlendModes.ADD).setTint(spec.eye).setAlpha(0.45),
            eyeL: add.image(x, y, TEXTURES.dot).setDepth(DEPTH.lights + 1).setTint(spec.eye),
            eyeR: add.image(x, y, TEXTURES.dot).setDepth(DEPTH.lights + 1).setTint(spec.eye)
        };
        this.shadows.push(shadow);

        return shadow;
    }

    // Moves, burns and draws every Shadow. Returns the Shadows touching the player and the light
    // multiplier caused by nearby Colossi.
    update (dt: number, time: number, ctx: HordeContext): { contacts: Contact[]; dim: number }
    {
        const contacts: Contact[] = [];
        let dim = 1;

        for (let i = this.shadows.length - 1; i >= 0; i--)
        {
            const s = this.shadows[i];
            const spec = SHADOWS[s.kind];
            const dx = ctx.player.x - s.x;
            const dy = ctx.player.y - s.y;
            const d = Math.hypot(dx, dy);
            const inLight = ctx.alive && rules.isInLight(d, ctx.lightRadius);

            let heading = Math.atan2(dy, dx) + Math.sin(time * 0.0017 + s.phase) * 0.5;
            let speed = s.speed * (inLight ? spec.lightSlow : 1);

            if (s.kind === 'moth')
            {
                // Zig-zag flight, with sudden dashes when close enough
                heading += Math.sin(time * 0.006 + s.phase) * 0.9;
                s.dash += dt;
                if (s.dash >= 0 && s.dash < MOTH_DASH_TIME && d < MOTH_DASH_RANGE) speed *= MOTH_DASH_SPEEDUP;
                else if (s.dash >= MOTH_DASH_TIME) s.dash = -PMath.FloatBetween(1.6, 3);
            }

            if (ctx.nightLost) speed *= CLOSING_IN_SPEED;
            s.x += Math.cos(heading) * speed * dt + s.kvx * dt;
            s.y += Math.sin(heading) * speed * dt + s.kvy * dt;
            const damping = Math.exp(-dt * KNOCKBACK_DAMPING);
            s.kvx *= damping;
            s.kvy *= damping;
            s.touchCd = Math.max(0, s.touchCd - dt);

            s.lit += ((inLight ? 1 : 0) - s.lit) * (1 - Math.exp(-dt * 8));
            if (inLight)
            {
                s.hp -= dt * rules.burnRate(d, ctx.lightRadius, ctx.swarm, s.kind, ctx.radiance);
                if (Math.random() < dt * 10 * s.size)
                {
                    this.fx.purple.emitParticle(1, s.x + PMath.Between(-14, 14) * s.size, s.y + PMath.Between(-14, 14) * s.size);
                }
            }

            if (s.kind === 'colossus' && ctx.alive) dim = Math.min(dim, rules.colossusDim(d));

            this.draw(s, heading, time, dt);

            if (s.hp <= 0)
            {
                this.kill(s, spec.points);
                continue;
            }

            if (ctx.alive && s.touchCd <= 0 && d < 16 + 12 * s.size) contacts.push({ shadow: s, distance: d });
        }

        return { contacts, dim };
    }

    // Removes a Shadow in a puff of smoke; `points` > 0 scores it
    kill (shadow: Shadow, points: number)
    {
        const index = this.shadows.indexOf(shadow);
        if (index === -1) return;

        this.shadows.splice(index, 1);
        this.fx.smoke.explode(10 * shadow.size, shadow.x, shadow.y);
        this.fx.purple.explode(16 * shadow.size, shadow.x, shadow.y);
        sfx.kill();
        if (points) this.onDissolved(shadow, points);
        [ shadow.body, shadow.body2, shadow.eyeGlow, shadow.eyeL, shadow.eyeR ].forEach((sprite) => sprite.destroy());
    }

    // The Colossus survives touching the player: it is pushed back and waits before hitting again
    bounceOff (shadow: Shadow, from: Point, distance: number)
    {
        shadow.touchCd = COLOSSUS_HIT_COOLDOWN;
        this.push(shadow, from, COLOSSUS_BOUNCE + (60 - Math.min(60, distance)));
    }

    // The light wave reaches the closest Shadows first; the Colossus only takes damage and recoils
    flashWave (origin: Point, range: number)
    {
        for (const shadow of [ ...this.shadows ])
        {
            const d = Math.hypot(shadow.x - origin.x, shadow.y - origin.y);
            if (d >= range) continue;

            this.scene.time.delayedCall((d / range) * FLASH_WAVE_DURATION, () =>
            {
                if (!this.shadows.includes(shadow)) return;

                if (shadow.kind !== 'colossus')
                {
                    this.kill(shadow, SHADOWS[shadow.kind].flashPoints);
                    return;
                }

                shadow.hp -= FLASH_COLOSSUS_DAMAGE;
                this.push(shadow, origin, FLASH_COLOSSUS_PUSH);
                this.fx.purple.explode(20, shadow.x, shadow.y);
                if (shadow.hp <= 0) this.kill(shadow, SHADOWS.colossus.flashPoints);
                else sfx.resist();
            });
        }
    }

    // Dawn: every Shadow dissolves, one after the other, without scoring
    dissolveAll (stagger: number)
    {
        this.shadows.slice().forEach((shadow, i) => this.scene.time.delayedCall(i * stagger, () => this.kill(shadow, 0)));
    }

    private push (shadow: Shadow, from: Point, force: number)
    {
        const d = Math.max(1, Math.hypot(shadow.x - from.x, shadow.y - from.y));
        shadow.kvx += ((shadow.x - from.x) / d) * force;
        shadow.kvy += ((shadow.y - from.y) / d) * force;
    }

    private draw (s: Shadow, heading: number, time: number, dt: number)
    {
        const hpFrac = PMath.Clamp(s.hp / s.maxHp, 0, 1);
        const wobble = Math.sin(time * 0.004 + s.phase);
        const shake = s.lit * (1 - hpFrac) * 3;
        const bx = s.x + PMath.FloatBetween(-shake, shake);
        const by = s.y + PMath.FloatBetween(-shake, shake);

        s.body.setPosition(bx, by).setScale(s.size * (1 + wobble * 0.08), s.size * (1 - wobble * 0.08)).setAlpha(0.55 + hpFrac * 0.45);

        if (s.kind === 'moth')
        {
            // Wings: a second puff of smoke, perpendicular to the heading, flapping fast
            const flap = 0.55 + 0.45 * Math.abs(Math.sin(time * 0.03 + s.phase));
            s.body2.setPosition(bx, by).setRotation(heading).setScale(s.size * 0.7, s.size * 2.1 * flap).setAlpha(0.35 + hpFrac * 0.4);
        }
        else
        {
            const orbit = (s.kind === 'colossus' ? 22 : 10) * s.size * 0.5;
            s.body2
                .setPosition(bx + Math.cos(time * 0.003 + s.phase) * orbit, by + Math.sin(time * 0.0027 + s.phase) * orbit)
                .setScale(s.size * 0.7)
                .setAlpha(0.4 + hpFrac * 0.5);
        }

        // Eyes: the only thing visible in the dark. They narrow in the light.
        s.blink -= dt;
        let open = 1 - s.lit * 0.65;
        if (s.blink < 0)
        {
            open = 0.05;
            if (s.blink < -0.12) s.blink = PMath.FloatBetween(2, 5);
        }
        const eyeSize = (s.kind === 'colossus' ? 0.4 : 0.55) * s.size;
        const fx = Math.cos(heading);
        const fy = Math.sin(heading);
        const ex = bx + fx * 7 * s.size;
        const ey = by + fy * 7 * s.size;
        const spread = 6 * s.size;
        s.eyeL.setPosition(ex - fy * spread, ey + fx * spread).setRotation(heading).setScale(eyeSize, eyeSize * open);
        s.eyeR.setPosition(ex + fy * spread, ey - fx * spread).setRotation(heading).setScale(eyeSize, eyeSize * open);
        s.eyeGlow.setPosition(ex, ey).setScale(0.9 * s.size).setAlpha(0.45 * open);
    }
}
