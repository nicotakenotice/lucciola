import { BlendModes, Display, GameObjects, Geom, Input, Math as PMath, Scene, Types } from 'phaser';
import { EventBus } from '../EventBus';
import { Events, GameEndResult, GameStats, HintTone, HudState } from '../events';
import { FONT_UI, HEIGHT, SHADOWS, ShadowKind, TUNING as T, WIDTH, loadBest, saveBest } from '../constants';
import { drawForest } from '../world';
import { music, sfx } from '../audio';
import { MessageKey, t } from '../../i18n';
import type { GameDebugApi, GameSnapshot, Point } from '../debug';

const D = { spores: 8, shadows: 5, bugs: 10, dark: 100, lights: 110, fx: 190 };
const HUD_BAND = 125;
const TOUCH = window.matchMedia('(pointer: coarse)').matches;
const ADD = BlendModes.ADD;
const { Between, FloatBetween, Clamp } = PMath;

type State = 'play' | 'over' | 'dawn';

interface Follower extends Point
{
    phase: number;
    pulse: number;
    bug: GameObjects.Image;
    glow: GameObjects.Image;
}

interface Pollen extends Point
{
    phase: number;
    glow: GameObjects.Image;
    core: GameObjects.Image;
}

interface LostFly extends Point
{
    angle: number;
    phase: number;
    on: number;
    bug: GameObjects.Image;
    glow: GameObjects.Image;
}

interface Dew extends Point
{
    life: number;
    glow: GameObjects.Image;
    core: GameObjects.Image;
    ring: GameObjects.Image;
}

interface Shadow extends Point
{
    kind: ShadowKind;
    size: number;
    hp: number;
    maxHp: number;
    speed: number;
    phase: number;
    lit: number;
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

type Keys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', Input.Keyboard.Key>;

export class Game extends Scene
{
    private state: State;
    private energy: number;
    private score: number;
    private elapsed: number;
    private flashCd: number;
    private flashBoost: number;
    private comboStep: number;
    private comboTimer: number;
    private heartTimer: number;
    private chirpTimer: number;
    private pollenTimer: number;
    private lostTimer: number;
    private shadowTimer: number;
    private dewTimer: number;
    private colossusTimer: number;
    private nextWave: number;
    private hudTimer: number;
    private lightScale: number;
    private darkAlpha: number;
    private splendor: number;
    private dim: number;
    private stats: GameStats;
    private hintsShown: Set<string>;
    private tutorial: boolean;

    private p: Point & { vx: number; vy: number };
    private history: Point[];
    private playerBug: GameObjects.Image;
    private playerGlow: GameObjects.Image;

    private followers: Follower[];
    private pollen: Pollen[];
    private lost: LostFly[];
    private shadows: Shadow[];
    private dew: Dew | null;

    private dark: GameObjects.RenderTexture;
    private sparks: GameObjects.Particles.ParticleEmitter;
    private cyanSparks: GameObjects.Particles.ParticleEmitter;
    private purple: GameObjects.Particles.ParticleEmitter;
    private smokeFx: GameObjects.Particles.ParticleEmitter;
    private trail: GameObjects.Particles.ParticleEmitter;
    private redFlash: GameObjects.Rectangle;
    private whiteFlash: GameObjects.Rectangle;

    private keys: Keys;
    private usePointer: boolean;
    private autopilot: Point | null = null;
    private resumedAt = 0;

    readonly debug: GameDebugApi = {
        snapshot: () => this.snapshot(),
        set: ({ energy, elapsed }) =>
        {
            if (energy !== undefined) this.energy = energy;
            if (elapsed !== undefined) this.elapsed = elapsed;
        },
        spawnShadow: (kind, at) =>
        {
            this.spawnShadow(kind);
            if (at) Object.assign(this.shadows[this.shadows.length - 1], at);
        },
        steerTo: (target) =>
        {
            this.autopilot = target;
        },
        flash: () => this.flash()
    };

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        drawForest(this, 'forest-game', String(Date.now()));

        this.state = 'play';
        this.energy = 100;
        this.score = 0;
        this.elapsed = 0;
        this.flashCd = 0;
        this.flashBoost = 0;
        this.comboStep = 0;
        this.comboTimer = 0;
        this.heartTimer = 0;
        this.chirpTimer = 2;
        this.pollenTimer = 0;
        this.lostTimer = 5;
        this.shadowTimer = 3;
        this.dewTimer = T.dewFirst;
        this.colossusTimer = 0;
        this.nextWave = 0;
        this.hudTimer = 0;
        this.lightScale = 1;
        this.darkAlpha = 0.955;
        this.splendor = 0;
        this.dim = 1;
        this.stats = { pollen: 0, rescued: 0, dissolved: 0, maxSwarm: 0, flashes: 0, dew: 0 };
        this.hintsShown = new Set();
        this.tutorial = loadBest() === 0;

        this.autopilot = null;
        this.p = { x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0 };
        this.history = Array.from({ length: 120 }, () => ({ x: this.p.x, y: this.p.y }));
        this.playerBug = this.add.image(this.p.x, this.p.y, 'bug').setDepth(D.bugs + 1);
        this.playerGlow = this.add.image(this.p.x, this.p.y, 'glow').setDepth(D.lights).setBlendMode(ADD).setTint(0xe4ff7a);

        this.followers = [];
        this.pollen = [];
        this.lost = [];
        this.shadows = [];
        this.dew = null;

        this.dark = this.add.renderTexture(0, 0, WIDTH, HEIGHT).setOrigin(0).setDepth(D.dark);

        this.createParticles();

        this.redFlash = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0xff2040).setOrigin(0).setAlpha(0).setDepth(D.fx);
        this.whiteFlash = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0xf6ffd0).setOrigin(0).setAlpha(0).setBlendMode(ADD).setDepth(D.fx);

        this.createInput();

        for (let i = 0; i < 6; i++) this.spawnPollen();

        this.cameras.main.fadeIn(500, 2, 3, 8);
        music.start();

        if (this.tutorial)
        {
            this.time.delayedCall(2500, () => this.hint('pollen', 'hint.pollen', 'info'));
        }

        this.emitHud();
        EventBus.emit(Events.SceneReady, this);
    }

    private createParticles ()
    {
        const sparkBase: Types.GameObjects.Particles.ParticleEmitterConfig = {
            lifespan: { min: 300, max: 800 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            emitting: false
        };
        this.sparks = this.add
            .particles(0, 0, 'glow', { ...sparkBase, speed: { min: 40, max: 180 }, tint: 0xe8ff80 })
            .setDepth(D.lights + 1);
        this.cyanSparks = this.add
            .particles(0, 0, 'glow', { ...sparkBase, speed: { min: 40, max: 200 }, tint: [ 0x7dfcff, 0xc8fff0, 0xffffff ] })
            .setDepth(D.lights + 1);
        this.purple = this.add
            .particles(0, 0, 'glow', {
                ...sparkBase,
                speed: { min: 30, max: 150 },
                scale: { start: 0.5, end: 0 },
                tint: [ 0x8a4dff, 0x5a2bb0, 0xc38bff ]
            })
            .setDepth(D.lights + 1);
        this.smokeFx = this.add
            .particles(0, 0, 'smoke', {
                speed: { min: 20, max: 90 },
                lifespan: { min: 500, max: 1000 },
                scale: { start: 0.6, end: 0.1 },
                alpha: { start: 0.8, end: 0 },
                emitting: false
            })
            .setDepth(D.shadows + 1);

        // Floating spores: drawn below the darkness, so they only show inside the light
        this.add
            .particles(0, 0, 'dot', {
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
            })
            .setDepth(D.spores);

        this.trail = this.add
            .particles(0, 0, 'glow', {
                follow: this.playerBug,
                frequency: 45,
                lifespan: 600,
                speed: { min: 2, max: 12 },
                scale: { start: 0.22, end: 0 },
                alpha: { start: 0.45, end: 0 },
                tint: 0xe4ff7a,
                blendMode: 'ADD'
            })
            .setDepth(D.lights - 1);
    }

    private createInput ()
    {
        const keyboard = this.input.keyboard!;
        this.keys = keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Keys;
        this.usePointer = false;

        this.input.on('pointermove', () =>
        {
            this.usePointer = true;
        });
        // On touch screens a tap moves the firefly: the Flash has its own HUD button
        this.input.on('pointerdown', (pointer: Input.Pointer) =>
        {
            this.usePointer = true;
            if (!pointer.wasTouch) this.flash();
        });
        keyboard.on('keydown-SPACE', () => this.flash());

        // Pause, restart, menu: commands coming from the React UI.
        // A paused scene stops update, timers and tweens, so the world stays frozen.
        const pause = () =>
        {
            if (this.state !== 'play' || this.scene.isPaused()) return;
            this.scene.pause();
            EventBus.emit(Events.Paused, true);
        };
        const resume = () =>
        {
            if (!this.scene.isPaused()) return;
            this.resumedAt = performance.now();
            this.scene.resume();
            EventBus.emit(Events.Paused, false);
        };
        const flash = () => this.flash();
        const restart = () => this.scene.restart();
        const menu = () => this.scene.start('Menu');
        EventBus.on(Events.UiPause, pause);
        EventBus.on(Events.UiResume, resume);
        EventBus.on(Events.UiFlash, flash);
        EventBus.on(Events.UiRestart, restart);
        EventBus.on(Events.UiMenu, menu);
        const cleanup = () =>
        {
            EventBus.off(Events.UiPause, pause);
            EventBus.off(Events.UiResume, resume);
            EventBus.off(Events.UiFlash, flash);
            EventBus.off(Events.UiRestart, restart);
            EventBus.off(Events.UiMenu, menu);
            music.setTension(0);
        };
        this.events.once('shutdown', cleanup);
        this.events.once('destroy', cleanup);
    }

    // ---------------------------------------------------------------- loop

    update (time: number, deltaMs: number)
    {
        const dt = Math.min(deltaMs / 1000, 0.05);

        if (this.state === 'play')
        {
            this.elapsed += dt;
            this.updateSpawners(dt);
            this.updateEnergy(dt);
        }

        this.updatePlayer(dt, time);
        this.updateFollowers(dt, time);
        this.updatePollen(dt, time);
        this.updateLost(dt, time);
        this.updateDew(dt, time);
        this.updateShadows(dt, time);

        this.flashCd = Math.max(0, this.flashCd - dt);
        this.flashBoost = Math.max(0, this.flashBoost - dt * 2.2);

        this.drawDarkness(time);

        this.hudTimer -= dt;
        if (this.hudTimer <= 0)
        {
            this.emitHud();
            this.updateTension();
            this.hudTimer = 0.08;
        }

        if (this.state === 'play')
        {
            if (this.energy <= 0) this.gameOver();
            else if (this.elapsed >= T.nightLength) this.dawn();
        }
    }

    private emitHud ()
    {
        const hud: HudState = {
            energy: Clamp(this.energy, 0, 100),
            followers: this.followers.length,
            maxFollowers: T.maxFollowers,
            score: this.score,
            combo: this.comboTimer > 0 && this.comboStep > 0 ? this.comboStep + 1 : 0,
            splendor: Clamp(this.splendor / T.splendorDuration, 0, 1),
            flashReady: this.state === 'play' && this.flashCd <= 0 && this.energy >= T.flashMin,
            flashMin: T.flashMin,
            nightProgress: Clamp(this.elapsed / T.nightLength, 0, 1),
            secondsToDawn: Math.max(0, Math.ceil(T.nightLength - this.elapsed)),
            dawn: this.state === 'dawn',
            alive: this.state === 'play'
        };
        EventBus.emit(Events.Hud, hud);
    }

    private updateTension ()
    {
        if (this.state !== 'play')
        {
            music.setTension(0);
            return;
        }

        let nearest = Infinity;
        for (const s of this.shadows) nearest = Math.min(nearest, Math.hypot(s.x - this.p.x, s.y - this.p.y));
        const threat = Clamp(1 - (nearest - 80) / 400, 0, 1);
        const low = Clamp((30 - this.energy) / 30, 0, 1);
        music.setTension(Math.max(threat, low));
    }

    // Each hint shows at most once per game (by id), in the current language
    private hint (id: string, message: MessageKey, tone: HintTone)
    {
        if (this.hintsShown.has(id)) return;
        this.hintsShown.add(id);
        EventBus.emit(Events.Hint, { text: t(message), tone });
    }

    private splendorFactor ()
    {
        // Fade out over the last half second instead of switching off abruptly
        return Clamp(this.splendor / 0.5, 0, 1);
    }

    private snapshot (): GameSnapshot
    {
        const point = ({ x, y }: Point) => ({ x, y });

        return {
            state: this.state,
            paused: this.scene.isPaused(),
            energy: this.energy,
            elapsed: this.elapsed,
            score: this.score,
            followers: this.followers.length,
            flashCooldown: this.flashCd,
            player: point(this.p),
            shadows: this.shadows.map((s) => ({ kind: s.kind, x: s.x, y: s.y })),
            pollen: this.pollen.map(point),
            lost: this.lost.map(point),
            dew: this.dew ? point(this.dew) : null,
            stats: { ...this.stats }
        };
    }

    private lightRadius ()
    {
        const r = T.baseRadius + Math.max(0, this.energy) * T.radiusPerEnergy + this.followers.length * T.radiusPerFollower;

        return r * (1 + this.splendorFactor() * T.splendorRadius) * this.dim * this.lightScale;
    }

    private updateEnergy (dt: number)
    {
        if (this.splendor > 0)
        {
            this.splendor -= dt;
            if (this.splendor <= 0)
            {
                this.splendor = 0;
                sfx.splendorEnd();
            }
        }
        else
        {
            this.energy -= dt * (T.energyDecay + this.elapsed * T.energyDecayGrowth);
        }

        this.comboTimer -= dt;
        if (this.comboTimer <= 0) this.comboStep = 0;

        if (this.energy < 30 && this.tutorial) this.hint('low', 'hint.low', 'danger');

        if (this.energy < 25)
        {
            this.heartTimer -= dt;
            if (this.heartTimer <= 0)
            {
                sfx.heartbeat();
                this.heartTimer = 0.6 + this.energy / 25;
            }
        }

        this.chirpTimer -= dt;
        if (this.chirpTimer <= 0)
        {
            sfx.chirp();
            this.chirpTimer = FloatBetween(2, 6);
        }

        if (this.elapsed > T.nightLength - 20) this.hint('predawn', 'hint.predawn', 'info');
    }

    private updateSpawners (dt: number)
    {
        this.pollenTimer -= dt;
        if (this.pollenTimer <= 0)
        {
            if (this.pollen.length < T.pollenMax) this.spawnPollen();
            this.pollenTimer = FloatBetween(0.8, 1.6);
        }

        this.lostTimer -= dt;
        if (this.lostTimer <= 0)
        {
            if (this.lost.length < 2 && this.followers.length < T.maxFollowers) this.spawnLost();
            this.lostTimer = FloatBetween(9, 14);
        }

        this.dewTimer -= dt;
        if (this.dewTimer <= 0 && !this.dew)
        {
            this.spawnDew();
            this.dewTimer = FloatBetween(T.dewInterval[0], T.dewInterval[1]);
        }

        this.colossusTimer -= dt;

        // Cap on Shadows on screen, rising through the night (waves may exceed it)
        const maxShadows = Math.min(T.maxShadows, 5 + this.elapsed / 15);
        this.shadowTimer -= dt;
        if (this.shadowTimer <= 0)
        {
            if (this.shadows.length < maxShadows) this.spawnShadow(this.pickKind());
            if (this.elapsed > 60 && Math.random() < 0.3 && this.shadows.length < maxShadows) this.spawnShadow(this.pickKind());
            this.shadowTimer = Math.max(0.9, 3.2 - this.elapsed * 0.02) * FloatBetween(0.8, 1.2);
        }

        if (this.nextWave < T.waves.length && this.elapsed >= T.waves[this.nextWave])
        {
            this.wave(this.nextWave);
            this.nextWave++;
        }
    }

    private pickKind (): ShadowKind
    {
        if (this.elapsed > T.colossusFrom && this.colossusTimer <= 0 && !this.shadows.some((s) => s.kind === 'colossus'))
        {
            this.colossusTimer = T.colossusInterval;
            return 'colossus';
        }

        const mothChance = Clamp((this.elapsed - 25) / 100, 0, 0.3);

        return Math.random() < mothChance ? 'moth' : 'shade';
    }

    private wave (index: number)
    {
        this.hint(`wave${index}`, 'hint.wave', 'danger');
        sfx.wave();
        this.cameras.main.shake(700, 0.004);

        const side = Between(0, 3);
        const count = 3 + index * 2;
        for (let i = 0; i < count; i++)
        {
            this.time.delayedCall(i * 260, () =>
            {
                if (this.state !== 'play') return;
                const kind: ShadowKind = index > 0 && i % 3 === 2 ? 'moth' : 'shade';
                this.spawnShadow(kind, side);
            });
        }
    }

    // ---------------------------------------------------------------- player

    private updatePlayer (dt: number, time: number)
    {
        const p = this.p;
        const k = this.keys;
        let dvx = 0;
        let dvy = 0;

        if (this.state === 'play')
        {
            const kx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
            const ky = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
            if (kx || ky)
            {
                this.usePointer = false;
                const len = Math.hypot(kx, ky);
                dvx = (kx / len) * T.playerSpeed;
                dvy = (ky / len) * T.playerSpeed;
            }
            else if (this.autopilot || this.usePointer)
            {
                const ptr = this.input.activePointer;
                const target = this.autopilot ?? { x: ptr.worldX, y: ptr.worldY };
                const dx = target.x - p.x;
                const dy = target.y - p.y;
                const d = Math.hypot(dx, dy);
                if (d > 4)
                {
                    const s = Math.min(T.playerSpeed, d * 3.5);
                    dvx = (dx / d) * s;
                    dvy = (dy / d) * s;
                }
            }
        }

        const a = 1 - Math.exp(-dt * 7);
        p.vx += (dvx - p.vx) * a;
        p.vy += (dvy - p.vy) * a;
        p.x = Clamp(p.x + p.vx * dt, 12, WIDTH - 12);
        p.y = Clamp(p.y + p.vy * dt, 12, HEIGHT - 12);

        const last = this.history[0];
        if (Math.hypot(p.x - last.x, p.y - last.y) > 3)
        {
            this.history.unshift({ x: p.x, y: p.y });
            if (this.history.length > 200) this.history.pop();
        }

        if (Math.hypot(p.vx, p.vy) > 10)
        {
            const target = Math.atan2(p.vy, p.vx) + Math.PI / 2;
            this.playerBug.rotation = PMath.Angle.RotateTo(this.playerBug.rotation, target, dt * 12);
        }
        this.playerBug.setPosition(p.x, p.y + Math.sin(time * 0.006) * 1.5);
        this.playerBug.scaleX = 1 + Math.sin(time * 0.06) * 0.12;

        // With little light the glow pulses like a heartbeat; during Radiance it turns bluish white
        const e = Clamp(this.energy / 100, 0, 1);
        const sf = this.splendorFactor();
        const heartbeat = this.energy < 25 && this.state === 'play' ? Math.max(0, Math.sin(time * 0.012)) * 0.25 : 0;
        this.playerGlow
            .setPosition(p.x, p.y)
            .setScale((0.7 + e * 0.7 + sf * 0.6 + heartbeat + Math.sin(time * 0.008) * 0.05) * this.lightScale)
            .setAlpha(0.5 + e * 0.5)
            .setTint(sf > 0 ? Display.Color.GetColor(228 - sf * 10, 255, 122 + sf * 133) : 0xe4ff7a);
    }

    private updateFollowers (dt: number, time: number)
    {
        const a = 1 - Math.exp(-dt * 5);
        this.followers.forEach((f, i) =>
        {
            const h = this.history[Math.min(this.history.length - 1, (i + 1) * 7)];
            const w = time * 0.003 + f.phase;
            const tx = h.x + Math.cos(w) * 12;
            const ty = h.y + Math.sin(w * 1.3) * 12;
            const nx = f.x + (tx - f.x) * a;
            const ny = f.y + (ty - f.y) * a;
            if (Math.hypot(nx - f.x, ny - f.y) > 0.3)
            {
                f.bug.rotation = PMath.Angle.RotateTo(f.bug.rotation, Math.atan2(ny - f.y, nx - f.x) + Math.PI / 2, dt * 10);
            }
            f.x = nx;
            f.y = ny;
            f.pulse = 0.6 + 0.4 * Math.sin(time * 0.004 + f.phase);
            f.bug.setPosition(f.x, f.y);
            f.bug.scaleX = 0.8 + Math.sin(time * 0.05 + f.phase) * 0.1;
            f.glow.setPosition(f.x, f.y).setAlpha(f.pulse * this.lightScale).setScale(0.5 + f.pulse * 0.25);
        });
    }

    private addFollower (x: number, y: number)
    {
        this.followers.push({
            x,
            y,
            phase: Math.random() * Math.PI * 2,
            pulse: 1,
            bug: this.add.image(x, y, 'bug').setDepth(D.bugs).setScale(0.8),
            glow: this.add.image(x, y, 'glow').setDepth(D.lights).setBlendMode(ADD).setTint(0x9dffcf)
        });
        this.stats.maxSwarm = Math.max(this.stats.maxSwarm, this.followers.length);
        if (this.followers.length === T.maxFollowers) this.hint('fullswarm', 'hint.fullSwarm', 'gift');
    }

    // ---------------------------------------------------------------- pollen

    // The top band is covered by the HUD: objects only spawn below it
    private randomSpot (minDist: number): Point
    {
        for (let i = 0; i < 20; i++)
        {
            const x = Between(40, WIDTH - 40);
            const y = Between(HUD_BAND, HEIGHT - 40);
            if (Math.hypot(x - this.p.x, y - this.p.y) > minDist) return { x, y };
        }

        return { x: Between(40, WIDTH - 40), y: Between(HUD_BAND, HEIGHT - 40) };
    }

    private spawnPollen ()
    {
        const { x, y } = this.randomSpot(140);
        const glow = this.add.image(x, y, 'glow').setDepth(D.lights).setBlendMode(ADD).setTint(0xfff27a).setScale(0);
        const core = this.add.image(x, y, 'dot').setDepth(D.lights + 1).setTint(0xfffbe0).setScale(0);
        this.tweens.add({ targets: glow, scale: 0.55, duration: 500, ease: 'Back.easeOut' });
        this.tweens.add({ targets: core, scale: 0.6, duration: 500, ease: 'Back.easeOut' });
        this.pollen.push({ x, y, glow, core, phase: Math.random() * 10 });
    }

    private updatePollen (dt: number, time: number)
    {
        const R = this.lightRadius();
        for (let i = this.pollen.length - 1; i >= 0; i--)
        {
            const pl = this.pollen[i];
            const dx = this.p.x - pl.x;
            const dy = this.p.y - pl.y;
            const d = Math.hypot(dx, dy);

            if (this.state === 'play' && d < R * 0.5 && d > 1)
            {
                const pull = 160 * (1 - d / (R * 0.5)) + 40;
                pl.x += (dx / d) * pull * dt;
                pl.y += (dy / d) * pull * dt;
            }

            const bob = Math.sin(time * 0.003 + pl.phase) * 2;
            pl.glow.setPosition(pl.x, pl.y + bob).setAlpha(0.7 + Math.sin(time * 0.005 + pl.phase) * 0.3);
            pl.core.setPosition(pl.x, pl.y + bob);

            if (this.state === 'play' && d < 22)
            {
                this.pollen.splice(i, 1);
                this.collectPollen(pl);
            }
        }
    }

    private collectPollen (pl: Pollen)
    {
        this.energy = Math.min(100, this.energy + T.pollenEnergy);
        this.comboStep = this.comboTimer > 0 ? this.comboStep + 1 : 0;
        this.comboTimer = 1.4;
        this.stats.pollen++;
        sfx.pickup(this.comboStep);

        const pts = Math.round(10 * (1 + this.followers.length * 0.25) * (1 + this.comboStep * 0.1));
        this.score += pts;
        this.floatText(pl.x, pl.y - 10, `+${pts}`, '#f4ffb0', 16);
        this.sparks.explode(8, pl.x, pl.y);
        pl.glow.destroy();
        pl.core.destroy();
    }

    // ---------------------------------------------------------------- moon dew

    private spawnDew ()
    {
        const { x, y } = this.randomSpot(260);
        const glow = this.add.image(x, y, 'glow').setDepth(D.lights).setBlendMode(ADD).setTint(0xbfe8ff).setScale(0);
        const core = this.add.image(x, y, 'dot').setDepth(D.lights + 1).setTint(0xffffff).setScale(0);
        const ring = this.add.image(x, y, 'ring').setDepth(D.lights).setBlendMode(ADD).setTint(0xbfe8ff).setScale(0);
        this.tweens.add({ targets: [ glow, core ], scale: 1, duration: 700, ease: 'Back.easeOut' });
        this.dew = { x, y, glow, core, ring, life: T.dewLifetime };
        this.hint('dew', 'hint.dew', 'gift');
    }

    private updateDew (dt: number, time: number)
    {
        const dew = this.dew;
        if (!dew) return;

        dew.life -= dt;
        // Blinks during the last 3 seconds to warn that it is fading
        const fading = dew.life < 3 ? (Math.sin(time * 0.03) > 0 ? 1 : 0.25) : 1;
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.006);
        dew.glow.setAlpha(fading).setScale(1 + pulse * 0.4);
        dew.core.setAlpha(fading).setScale(0.8 + pulse * 0.3);
        dew.ring.setAlpha(fading * (1 - ((time * 0.001) % 1))).setScale(0.2 + ((time * 0.001) % 1) * 0.5);

        if (this.state === 'play' && Math.hypot(this.p.x - dew.x, this.p.y - dew.y) < 28)
        {
            this.collectDew(dew);
        }
        else if (dew.life <= 0 || this.state !== 'play')
        {
            this.tweens.add({ targets: [ dew.glow, dew.core, dew.ring ], alpha: 0, scale: 0, duration: 400, onComplete: () => this.destroyDew(dew) });
            this.dew = null;
        }
    }

    private collectDew (dew: Dew)
    {
        this.dew = null;
        this.destroyDew(dew);
        this.splendor = T.splendorDuration;
        this.energy = Math.min(100, this.energy + T.dewEnergy);
        this.score += 40;
        this.stats.dew++;
        sfx.dew();
        this.cyanSparks.explode(36, dew.x, dew.y);
        this.floatText(dew.x, dew.y - 20, t('game.splendor', { n: 40 }), '#dff4ff', 22);
        this.hint('splendor', 'hint.splendor', 'gift');
        this.whiteFlash.setAlpha(0.12);
        this.tweens.add({ targets: this.whiteFlash, alpha: 0, duration: 500 });
    }

    private destroyDew (dew: Dew)
    {
        [ dew.glow, dew.core, dew.ring ].forEach((o) => o.destroy());
    }

    // ---------------------------------------------------------------- lost fireflies

    private spawnLost ()
    {
        const { x, y } = this.randomSpot(300);
        this.lost.push({
            x,
            y,
            angle: Math.random() * Math.PI * 2,
            phase: Math.random() * 2,
            on: 0,
            bug: this.add.image(x, y, 'bug').setDepth(D.bugs).setScale(0.8),
            glow: this.add.image(x, y, 'glow').setDepth(D.lights).setBlendMode(ADD).setTint(0x7dfcff)
        });
        if (this.tutorial) this.hint('lost', 'hint.lost', 'info');
    }

    private updateLost (dt: number, time: number)
    {
        for (let i = this.lost.length - 1; i >= 0; i--)
        {
            const l = this.lost[i];
            l.angle += Math.sin(time * 0.0013 + l.phase * 3) * 2 * dt;
            l.x += Math.cos(l.angle) * 45 * dt;
            l.y += Math.sin(l.angle) * 45 * dt;
            if (l.x < 40 || l.x > WIDTH - 40) l.angle = Math.PI - l.angle;
            if (l.y < HUD_BAND || l.y > HEIGHT - 40) l.angle = -l.angle;
            l.x = Clamp(l.x, 40, WIDTH - 40);
            l.y = Clamp(l.y, HUD_BAND, HEIGHT - 40);

            // Blinks like a real firefly: one signal every 1.6 seconds
            const lit = (time * 0.001 + l.phase) % 1.6 < 0.55;
            l.on += ((lit ? 1 : 0.12) - l.on) * (1 - Math.exp(-dt * 12));
            l.bug.setPosition(l.x, l.y).setRotation(l.angle + Math.PI / 2);
            l.bug.scaleX = 0.8 + Math.sin(time * 0.05 + l.phase) * 0.1;
            l.glow.setPosition(l.x, l.y).setAlpha(l.on).setScale(0.6 + l.on * 0.9);

            if (this.state === 'play' && Math.hypot(this.p.x - l.x, this.p.y - l.y) < 28)
            {
                this.lost.splice(i, 1);
                this.rescue(l);
            }
        }
    }

    private rescue (l: LostFly)
    {
        l.bug.destroy();
        l.glow.destroy();
        this.cyanSparks.explode(20, l.x, l.y);
        sfx.join();
        this.energy = Math.min(100, this.energy + T.lostEnergy);
        this.score += 50;
        this.stats.rescued++;

        if (this.followers.length < T.maxFollowers)
        {
            this.addFollower(l.x, l.y);
            this.floatText(l.x, l.y - 16, t('game.newFirefly', { n: 50 }), '#a8fff0', 20);
        }
        else
        {
            this.floatText(l.x, l.y - 16, '+50', '#a8fff0', 20);
        }
    }

    // ---------------------------------------------------------------- shadows

    private spawnShadow (kind: ShadowKind, side = Between(0, 3))
    {
        const spec = SHADOWS[kind];
        const x = side === 0 ? -60 : side === 1 ? WIDTH + 60 : Between(0, WIDTH);
        const y = side === 2 ? -60 : side === 3 ? HEIGHT + 60 : Between(0, HEIGHT);
        // Common Shadows grow and speed up as the night goes on; the Colossus stays slow
        const grow = kind === 'shade' ? Math.min(0.5, this.elapsed / 300) : 0;
        const haste = kind === 'colossus' ? 0 : this.elapsed * 0.35;
        const size = FloatBetween(spec.size[0], spec.size[1]) + grow;
        const hp = kind === 'shade' ? spec.hp * size : spec.hp;

        this.shadows.push({
            kind,
            x,
            y,
            size,
            hp,
            maxHp: hp,
            speed: Math.min(spec.speed[1] * 1.9, FloatBetween(spec.speed[0], spec.speed[1]) + haste),
            phase: Math.random() * 10,
            lit: 0,
            blink: FloatBetween(1, 4),
            dash: -FloatBetween(1.5, 3),
            kvx: 0,
            kvy: 0,
            touchCd: 0,
            body: this.add.image(x, y, 'smoke').setDepth(D.shadows),
            body2: this.add.image(x, y, 'smoke').setDepth(D.shadows),
            eyeGlow: this.add.image(x, y, 'glow').setDepth(D.lights).setBlendMode(ADD).setTint(spec.eye).setAlpha(0.45),
            eyeL: this.add.image(x, y, 'dot').setDepth(D.lights + 1).setTint(spec.eye),
            eyeR: this.add.image(x, y, 'dot').setDepth(D.lights + 1).setTint(spec.eye)
        });

        if (kind === 'moth')
        {
            sfx.moth();
            this.hint('moth', 'hint.moth', 'danger');
        }
        else if (kind === 'colossus')
        {
            sfx.colossus();
            this.cameras.main.shake(900, 0.003);
            this.hint('colossus', 'hint.colossus', 'danger');
        }
    }

    private updateShadows (dt: number, time: number)
    {
        const R = this.lightRadius();
        const p = this.p;
        let dim = 1;

        for (let i = this.shadows.length - 1; i >= 0; i--)
        {
            const s = this.shadows[i];
            const spec = SHADOWS[s.kind];
            const dx = p.x - s.x;
            const dy = p.y - s.y;
            const d = Math.hypot(dx, dy);
            const inLight = this.state === 'play' && d < R * 0.92;

            let ang = Math.atan2(dy, dx) + Math.sin(time * 0.0017 + s.phase) * 0.5;
            let spd = s.speed * (inLight ? spec.lightSlow : 1);

            if (s.kind === 'moth')
            {
                // Zig-zag flight, with sudden dashes when close enough
                ang += Math.sin(time * 0.006 + s.phase) * 0.9;
                s.dash += dt;
                if (s.dash >= 0 && s.dash < 0.45 && d < 380) spd *= 2.3;
                else if (s.dash >= 0.45) s.dash = -FloatBetween(1.6, 3);
            }

            if (this.state === 'over') spd *= 0.35;
            s.x += Math.cos(ang) * spd * dt + s.kvx * dt;
            s.y += Math.sin(ang) * spd * dt + s.kvy * dt;
            const damp = Math.exp(-dt * 4);
            s.kvx *= damp;
            s.kvy *= damp;
            s.touchCd = Math.max(0, s.touchCd - dt);

            s.lit += ((inLight ? 1 : 0) - s.lit) * (1 - Math.exp(-dt * 8));
            if (inLight)
            {
                const heat = 1 - d / R;
                const splendor = 1 + this.splendorFactor() * (T.splendorBurn - 1);
                s.hp -= dt * (0.25 + heat * 1.1) * (1 + this.followers.length * 0.06) * spec.burn * splendor;
                if (Math.random() < dt * 10 * s.size) this.purple.emitParticle(1, s.x + Between(-14, 14) * s.size, s.y + Between(-14, 14) * s.size);
            }

            if (s.kind === 'colossus' && this.state === 'play' && d < T.colossusDimRange)
            {
                dim = Math.min(dim, 1 - T.colossusDim * (1 - d / T.colossusDimRange));
            }

            this.drawShadow(s, ang, time, dt);

            if (s.hp <= 0)
            {
                this.killShadow(s, spec.points);
                continue;
            }

            for (let j = this.lost.length - 1; j >= 0; j--)
            {
                const l = this.lost[j];
                if (Math.hypot(l.x - s.x, l.y - s.y) < 18 * s.size)
                {
                    this.lost.splice(j, 1);
                    this.purple.explode(12, l.x, l.y);
                    sfx.gulp();
                    l.bug.destroy();
                    l.glow.destroy();
                }
            }

            if (this.state === 'play' && d < 350 && this.tutorial) this.hint('shadow', TOUCH ? 'hint.shadow.touch' : 'hint.shadow.pointer', 'danger');
            if (this.state === 'play' && s.touchCd <= 0 && d < 16 + 12 * s.size) this.hitPlayer(s, d);
        }

        // The Colossus dims the light gradually, not abruptly
        this.dim += (dim - this.dim) * (1 - Math.exp(-dt * 3));
    }

    private drawShadow (s: Shadow, ang: number, time: number, dt: number)
    {
        const hpFrac = Clamp(s.hp / s.maxHp, 0, 1);
        const wob = Math.sin(time * 0.004 + s.phase);
        const shake = s.lit * (1 - hpFrac) * 3;
        const bx = s.x + FloatBetween(-shake, shake);
        const by = s.y + FloatBetween(-shake, shake);

        s.body.setPosition(bx, by).setScale(s.size * (1 + wob * 0.08), s.size * (1 - wob * 0.08)).setAlpha(0.55 + hpFrac * 0.45);

        if (s.kind === 'moth')
        {
            // Wings: a second puff of smoke, perpendicular to the heading, flapping fast
            const flap = 0.55 + 0.45 * Math.abs(Math.sin(time * 0.03 + s.phase));
            s.body2.setPosition(bx, by).setRotation(ang).setScale(s.size * 0.7, s.size * 2.1 * flap).setAlpha(0.35 + hpFrac * 0.4);
        }
        else
        {
            const orbit = s.kind === 'colossus' ? 22 : 10;
            s.body2
                .setPosition(bx + Math.cos(time * 0.003 + s.phase) * orbit * s.size * 0.5, by + Math.sin(time * 0.0027 + s.phase) * orbit * s.size * 0.5)
                .setScale(s.size * 0.7)
                .setAlpha(0.4 + hpFrac * 0.5);
        }

        // Eyes: the only thing visible in the dark. They narrow in the light.
        s.blink -= dt;
        let open = 1 - s.lit * 0.65;
        if (s.blink < 0)
        {
            open = 0.05;
            if (s.blink < -0.12) s.blink = FloatBetween(2, 5);
        }
        const eyeSize = s.kind === 'colossus' ? 0.4 : 0.55;
        const fx = Math.cos(ang);
        const fy = Math.sin(ang);
        const ex = bx + fx * 7 * s.size;
        const ey = by + fy * 7 * s.size;
        const off = 6 * s.size;
        s.eyeL.setPosition(ex - fy * off, ey + fx * off).setRotation(ang).setScale(eyeSize * s.size, eyeSize * s.size * open);
        s.eyeR.setPosition(ex + fy * off, ey - fx * off).setRotation(ang).setScale(eyeSize * s.size, eyeSize * s.size * open);
        s.eyeGlow.setPosition(ex, ey).setScale(0.9 * s.size).setAlpha(0.45 * open);
    }

    private killShadow (s: Shadow, points: number)
    {
        const idx = this.shadows.indexOf(s);
        if (idx === -1) return;

        this.shadows.splice(idx, 1);
        this.smokeFx.explode(10 * s.size, s.x, s.y);
        this.purple.explode(16 * s.size, s.x, s.y);
        sfx.kill();
        if (points)
        {
            this.score += points;
            this.stats.dissolved++;
            this.floatText(s.x, s.y - 20 * s.size, `+${points}`, '#d4b8ff', s.kind === 'colossus' ? 24 : 16);
        }
        [ s.body, s.body2, s.eyeGlow, s.eyeL, s.eyeR ].forEach((o) => o.destroy());
    }

    private push (s: Shadow, force: number)
    {
        const d = Math.max(1, Math.hypot(s.x - this.p.x, s.y - this.p.y));
        s.kvx += ((s.x - this.p.x) / d) * force;
        s.kvy += ((s.y - this.p.y) / d) * force;
    }

    private hitPlayer (s: Shadow, d: number)
    {
        const spec = SHADOWS[s.kind];

        // The Colossus does not dissolve on impact: it hits, gets pushed back and returns
        if (s.kind === 'colossus')
        {
            s.touchCd = 2.5;
            this.push(s, 620 + (60 - Math.min(60, d)));
        }
        else
        {
            this.killShadow(s, 0);
        }

        const shields = s.kind === 'colossus' ? 2 : 1;
        let saved = 0;
        for (let i = 0; i < shields && this.followers.length > 0; i++)
        {
            const f = this.followers.pop()!;
            this.cyanSparks.explode(16, f.x, f.y);
            f.bug.destroy();
            f.glow.destroy();
            saved++;
        }

        if (saved > 0)
        {
            sfx.lose();
            this.floatText(this.p.x, this.p.y - 30, t(saved > 1 ? 'game.savedTwo' : 'game.savedOne'), '#a8fff0', 16);
            this.cameras.main.shake(150, 0.005);
        }
        else
        {
            this.energy -= spec.hitEnergy;
            sfx.hurt();
            this.cameras.main.shake(260, 0.014);
            this.redFlash.setAlpha(0.35);
            this.tweens.add({ targets: this.redFlash, alpha: 0, duration: 400 });
        }
    }

    // ---------------------------------------------------------------- flash

    private flash ()
    {
        if (this.state !== 'play' || this.flashCd > 0) return;

        // A key pressed while paused may be delivered right after resuming: ignore it
        if (performance.now() - this.resumedAt < 200) return;

        if (this.energy < T.flashMin)
        {
            sfx.fizzle();
            this.floatText(this.p.x, this.p.y - 30, t('game.tooWeak'), '#ffb08a', 16);
            return;
        }

        this.energy -= T.flashCost;
        this.flashCd = T.flashCooldown;
        this.flashBoost = 1;
        this.stats.flashes++;
        sfx.flash();

        const { x, y } = this.p;
        const ring = this.add.image(x, y, 'ring').setDepth(D.lights + 2).setBlendMode(ADD).setTint(0xf6ffc0).setScale(0.2);
        this.tweens.add({
            targets: ring,
            scale: T.flashRange / 60,
            alpha: 0,
            duration: 450,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
        });
        this.whiteFlash.setAlpha(0.18);
        this.tweens.add({ targets: this.whiteFlash, alpha: 0, duration: 250 });
        this.tweens.add({ targets: this.cameras.main, zoom: 1.02, duration: 70, yoyo: true, ease: 'Quad.easeOut' });
        this.sparks.explode(30, x, y);

        // The light wave reaches the closest Shadows first
        for (const s of [ ...this.shadows ])
        {
            const d = Math.hypot(s.x - x, s.y - y);
            if (d >= T.flashRange) continue;

            this.time.delayedCall((d / T.flashRange) * 400, () =>
            {
                if (!this.shadows.includes(s)) return;

                if (s.kind === 'colossus')
                {
                    s.hp -= 3.5;
                    this.push(s, 380);
                    this.purple.explode(20, s.x, s.y);
                    if (s.hp <= 0) this.killShadow(s, SHADOWS.colossus.flashPoints);
                    else sfx.resist();
                }
                else
                {
                    this.killShadow(s, SHADOWS[s.kind].flashPoints);
                }
            });
        }
    }

    // ---------------------------------------------------------------- end of game

    private gameOver ()
    {
        this.state = 'over';
        this.energy = 0;
        this.splendor = 0;
        this.trail.stop();
        sfx.gameOver();

        this.tweens.add({ targets: this, lightScale: 0, duration: 1800, ease: 'Sine.easeIn' });
        this.followers.forEach((f) =>
        {
            this.tweens.add({
                targets: [ f.bug, f.glow ],
                alpha: 0,
                x: f.x + Between(-200, 200),
                y: f.y + Between(-200, 200),
                duration: 1600
            });
        });

        this.endWith(1000, { kind: 'over', bonus: 0 });
    }

    private dawn ()
    {
        this.state = 'dawn';
        sfx.dawn();

        const bonus = this.followers.length * 100 + Math.round(this.energy) * 5;
        this.score += bonus;

        this.shadows.slice().forEach((s, i) => this.time.delayedCall(i * 80, () => this.killShadow(s, 0)));
        this.tweens.add({ targets: this, darkAlpha: 0, duration: 3000, ease: 'Sine.easeInOut' });
        const sun = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0xffc98a).setOrigin(0).setAlpha(0).setBlendMode(ADD).setDepth(D.dark + 1);
        this.tweens.add({ targets: sun, alpha: 0.18, duration: 3000 });

        this.endWith(1600, { kind: 'dawn', bonus });
    }

    private endWith (delay: number, partial: Pick<GameEndResult, 'kind' | 'bonus'>)
    {
        const previousBest = loadBest();
        const result: GameEndResult = {
            ...partial,
            score: this.score,
            best: saveBest(this.score),
            newRecord: this.score > previousBest,
            seconds: Math.floor(this.elapsed),
            stats: { ...this.stats }
        };
        this.emitHud();
        this.time.delayedCall(delay, () => EventBus.emit(Events.GameEnd, result));
    }

    // ---------------------------------------------------------------- rendering

    private drawDarkness (time: number)
    {
        const rt = this.dark;
        rt.clear();

        if (this.darkAlpha > 0.001)
        {
            // During the last 25 seconds the sky starts to brighten
            const pre = Clamp((this.elapsed - (T.nightLength - 25)) / 25, 0, 1);
            const color = Display.Color.GetColor(3 + pre * 14, 4 + pre * 8, 10 + pre * 26);
            rt.fill(color, this.darkAlpha - pre * 0.07);

            const erase = (x: number, y: number, r: number, alpha = 1) =>
            {
                if (r > 1 && alpha > 0.01)
                {
                    rt.stamp('light', undefined, x, y, { scale: r / 128, alpha, blendMode: BlendModes.ERASE });
                }
            };

            const flicker = 1 + Math.sin(time * 0.011) * 0.015 + (Math.random() - 0.5) * 0.02;
            const R = this.lightRadius() * flicker;
            erase(this.p.x, this.p.y, R);
            if (this.flashBoost > 0) erase(this.p.x, this.p.y, R + (1 - this.flashBoost) * T.flashRange, this.flashBoost);

            for (const f of this.followers) erase(f.x, f.y, 55 * this.lightScale, 0.8 * f.pulse);
            for (const pl of this.pollen) erase(pl.x, pl.y, 26, 0.6);
            for (const l of this.lost) erase(l.x, l.y, 70, l.on * 0.9);
            if (this.dew) erase(this.dew.x, this.dew.y, 70, this.dew.glow.alpha * 0.8);
        }

        rt.render();
    }

    private floatText (x: number, y: number, msg: string, color: string, size: number)
    {
        const t = this.add
            .text(x, y, msg, { fontFamily: FONT_UI, fontSize: `${size}px`, color, fontStyle: '700', stroke: '#000000', strokeThickness: 4 })
            .setOrigin(0.5)
            .setDepth(D.fx + 1);
        this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 1000, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
    }
}
