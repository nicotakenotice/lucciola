import { BlendModes, GameObjects, Geom, Scene, Types } from 'phaser';
import { FONT_UI, HEIGHT, WIDTH } from '../constants';
import { DEPTH } from '../layout';

type Emitter = GameObjects.Particles.ParticleEmitter;

// Particles, floating texts and full-screen flashes shared by every entity
export class Effects
{
    readonly sparks: Emitter;
    readonly cyan: Emitter;
    readonly purple: Emitter;
    readonly smoke: Emitter;

    private readonly trail: Emitter;
    private readonly redFlash: GameObjects.Rectangle;
    private readonly whiteFlash: GameObjects.Rectangle;

    constructor (private readonly scene: Scene, trailTarget: GameObjects.Image)
    {
        const burst: Types.GameObjects.Particles.ParticleEmitterConfig = {
            lifespan: { min: 300, max: 800 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            emitting: false
        };
        const add = scene.add;

        this.sparks = add.particles(0, 0, 'glow', { ...burst, speed: { min: 40, max: 180 }, tint: 0xe8ff80 }).setDepth(DEPTH.lights + 1);
        this.cyan = add
            .particles(0, 0, 'glow', { ...burst, speed: { min: 40, max: 200 }, tint: [ 0x7dfcff, 0xc8fff0, 0xffffff ] })
            .setDepth(DEPTH.lights + 1);
        this.purple = add
            .particles(0, 0, 'glow', { ...burst, speed: { min: 30, max: 150 }, scale: { start: 0.5, end: 0 }, tint: [ 0x8a4dff, 0x5a2bb0, 0xc38bff ] })
            .setDepth(DEPTH.lights + 1);
        this.smoke = add
            .particles(0, 0, 'smoke', {
                speed: { min: 20, max: 90 },
                lifespan: { min: 500, max: 1000 },
                scale: { start: 0.6, end: 0.1 },
                alpha: { start: 0.8, end: 0 },
                emitting: false
            })
            .setDepth(DEPTH.shadows + 1);

        // Floating spores: drawn below the darkness, so they only show inside the light
        add.particles(0, 0, 'dot', {
            emitZone: { type: 'random', source: new Geom.Rectangle(0, 0, WIDTH, HEIGHT), quantity: 1 },
            lifespan: 7000,
            frequency: 70,
            speedX: { min: -8, max: 8 },
            speedY: { min: -14, max: -2 },
            scale: { min: 0.12, max: 0.3 },
            alpha: { start: 0, end: 0, onUpdate: (_p: unknown, _k: unknown, t: number) => Math.sin(t * Math.PI) * 0.75 },
            tint: [ 0xfff6c8, 0xd8ffe0, 0xffffff ],
            blendMode: 'ADD',
            advance: 7000
        }).setDepth(DEPTH.spores);

        this.trail = add
            .particles(0, 0, 'glow', {
                follow: trailTarget,
                frequency: 45,
                lifespan: 600,
                speed: { min: 2, max: 12 },
                scale: { start: 0.22, end: 0 },
                alpha: { start: 0.45, end: 0 },
                tint: 0xe4ff7a,
                blendMode: 'ADD'
            })
            .setDepth(DEPTH.lights - 1);

        this.redFlash = add.rectangle(0, 0, WIDTH, HEIGHT, 0xff2040).setOrigin(0).setAlpha(0).setDepth(DEPTH.effects);
        this.whiteFlash = add
            .rectangle(0, 0, WIDTH, HEIGHT, 0xf6ffd0)
            .setOrigin(0)
            .setAlpha(0)
            .setBlendMode(BlendModes.ADD)
            .setDepth(DEPTH.effects);
    }

    stopTrail ()
    {
        this.trail.stop();
    }

    screenFlash (color: 'red' | 'white', alpha: number, duration: number)
    {
        const flash = color === 'red' ? this.redFlash : this.whiteFlash;
        flash.setAlpha(alpha);
        this.scene.tweens.add({ targets: flash, alpha: 0, duration });
    }

    // Expanding ring and a short camera punch for the Flash
    lightWave (x: number, y: number, range: number)
    {
        const ring = this.scene.add
            .image(x, y, 'ring')
            .setDepth(DEPTH.lights + 2)
            .setBlendMode(BlendModes.ADD)
            .setTint(0xf6ffc0)
            .setScale(0.2);
        this.scene.tweens.add({
            targets: ring,
            scale: range / 60,
            alpha: 0,
            duration: 450,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
        });
        this.scene.tweens.add({ targets: this.scene.cameras.main, zoom: 1.02, duration: 70, yoyo: true, ease: 'Quad.easeOut' });
        this.sparks.explode(30, x, y);
    }

    floatText (x: number, y: number, message: string, color: string, size: number)
    {
        const text = this.scene.add
            .text(x, y, message, { fontFamily: FONT_UI, fontSize: `${size}px`, color, fontStyle: '700', stroke: '#000000', strokeThickness: 4 })
            .setOrigin(0.5)
            .setDepth(DEPTH.effects + 1);
        this.scene.tweens.add({ targets: text, y: y - 40, alpha: 0, duration: 1000, ease: 'Cubic.easeOut', onComplete: () => text.destroy() });
    }
}
