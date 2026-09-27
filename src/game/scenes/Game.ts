import { BlendModes, Input, Math as PMath, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Events, GameEndResult, GameStats, HintTone, HudState } from '../events';
import { HEIGHT, SHADOWS, ShadowKind, TUNING as T, WIDTH, loadBest, saveBest } from '../constants';
import * as rules from '../rules';
import { drawForest } from '../world';
import { music, sfx } from '../audio';
import { MessageKey, t } from '../../i18n';
import type { GameDebugApi, GameSnapshot, Point } from '../debug';
import { DEPTH, randomSpot } from '../layout';
import { NightDirector } from '../director';
import { Firefly } from '../entities/Firefly';
import { Swarm } from '../entities/Swarm';
import { PollenField } from '../entities/PollenField';
import { LostFireflies } from '../entities/LostFireflies';
import { MoonDew } from '../entities/MoonDew';
import { Contact, Shadow, ShadowHorde } from '../entities/ShadowHorde';
import { Darkness, LightSpot } from '../systems/Darkness';
import { Effects } from '../systems/Effects';

type RunState = 'play' | 'over' | 'dawn';
type Keys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', Input.Keyboard.Key>;

const TOUCH = window.matchMedia('(pointer: coarse)').matches;
const MAX_STEP = 0.05;          // seconds: longer frames are slowed down rather than skipped
const HUD_INTERVAL = 0.08;
const COMBO_WINDOW = 1.4;
const LOW_LIGHT = 25;
const RESCUE_POINTS = 50;
const DEW_POINTS = 40;
const { Between, FloatBetween, Clamp } = PMath;

// Coordinates one night: owns the run state, reads input, spawns things and applies the
// consequences of what the entities report (pickups, contacts, dissolved Shadows).
export class Game extends Scene
{
    private state: RunState;
    private energy: number;
    private score: number;
    private elapsed: number;
    private splendor: number;
    private dim: number;
    private lightScale: number;
    private flashCd: number;
    private flashBoost: number;
    private comboStep: number;
    private comboTimer: number;
    private stats: GameStats;
    private hintsShown: Set<string>;
    private tutorial: boolean;

    private timers: { heart: number; chirp: number; hud: number };
    private director: NightDirector;

    private firefly: Firefly;
    private swarm: Swarm;
    private pollen: PollenField;
    private lost: LostFireflies;
    private dew: MoonDew;
    private horde: ShadowHorde;
    private darkness: Darkness;
    private fx: Effects;

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
            const shadow = this.spawnShadow(kind);
            if (at) Object.assign(shadow, at);
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
        this.splendor = 0;
        this.dim = 1;
        this.lightScale = 1;
        this.flashCd = 0;
        this.flashBoost = 0;
        this.comboStep = 0;
        this.comboTimer = 0;
        this.stats = { pollen: 0, rescued: 0, dissolved: 0, maxSwarm: 0, flashes: 0, dew: 0 };
        this.hintsShown = new Set();
        this.tutorial = loadBest() === 0;
        this.timers = { heart: 0, chirp: 2, hud: 0 };
        this.director = new NightDirector();
        this.autopilot = null;

        this.firefly = new Firefly(this);
        this.swarm = new Swarm(this);
        this.pollen = new PollenField(this);
        this.lost = new LostFireflies(this);
        this.dew = new MoonDew(this);
        this.darkness = new Darkness(this);
        this.fx = new Effects(this, this.firefly.sprite);
        this.horde = new ShadowHorde(this, this.fx, (shadow, points) => this.onShadowDissolved(shadow, points));

        this.createInput();

        for (let i = 0; i < 6; i++) this.pollen.spawn(randomSpot(this.firefly.position, 140));

        this.cameras.main.fadeIn(500, 2, 3, 8);
        music.start();

        if (this.tutorial) this.time.delayedCall(2500, () => this.hint('pollen', 'hint.pollen', 'info'));

        this.emitHud();
        EventBus.emit(Events.SceneReady, this);
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

        // Commands from the React UI. A paused scene stops update, timers and tweens.
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
        const handlers: [ string, () => void ][] = [
            [ Events.UiPause, pause ],
            [ Events.UiResume, resume ],
            [ Events.UiFlash, flash ],
            [ Events.UiRestart, restart ],
            [ Events.UiMenu, menu ]
        ];
        handlers.forEach(([ event, handler ]) => EventBus.on(event, handler));

        const cleanup = () =>
        {
            handlers.forEach(([ event, handler ]) => EventBus.off(event, handler));
            music.setTension(0);
        };
        this.events.once('shutdown', cleanup);
        this.events.once('destroy', cleanup);
    }

    // ---------------------------------------------------------------- loop

    update (time: number, deltaMs: number)
    {
        const dt = Math.min(deltaMs / 1000, MAX_STEP);
        const alive = this.state === 'play';
        const player = this.firefly.position;

        if (alive)
        {
            this.elapsed += dt;
            this.runDirector(dt);
            this.updateEnergy(dt);
        }

        this.firefly.update(dt, time, this.desiredVelocity(), {
            energy: this.energy,
            radiance: rules.splendorFactor(this.splendor),
            lowLight: alive && this.energy < LOW_LIGHT,
            scale: this.lightScale
        });
        this.swarm.update(dt, time, this.firefly.path, this.lightScale);

        const radius = this.lightRadius();
        this.pollen.update(dt, time, player, radius, alive).forEach((spot) => this.collectPollen(spot));
        this.lost.update(dt, time, player, alive).forEach((spot) => this.rescue(spot));
        const dewSpot = this.dew.update(dt, time, player, alive);
        if (dewSpot) this.collectDew(dewSpot);

        const { contacts, dim } = this.horde.update(dt, time, {
            player,
            lightRadius: radius,
            alive,
            lost: this.state === 'over',
            swarm: this.swarm.size,
            splendor: this.splendor
        });
        this.afterShadowsMoved(contacts);
        // The Colossus dims the light gradually, not abruptly
        this.dim += (dim - this.dim) * (1 - Math.exp(-dt * 3));

        this.flashCd = Math.max(0, this.flashCd - dt);
        this.flashBoost = Math.max(0, this.flashBoost - dt * 2.2);

        this.darkness.render(this.lightSpots(time), Clamp((this.elapsed - (T.nightLength - 25)) / 25, 0, 1));

        this.timers.hud -= dt;
        if (this.timers.hud <= 0)
        {
            this.emitHud();
            this.updateTension();
            this.timers.hud = HUD_INTERVAL;
        }

        if (this.state === 'play')
        {
            if (this.energy <= 0) this.gameOver();
            else if (this.elapsed >= T.nightLength) this.dawn();
        }
    }

    // Keyboard wins over the autopilot (tests, bots), which wins over the pointer
    private desiredVelocity (): Point
    {
        if (this.state !== 'play') return { x: 0, y: 0 };

        const k = this.keys;
        const kx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
        const ky = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
        if (kx || ky)
        {
            this.usePointer = false;
            const len = Math.hypot(kx, ky);

            return { x: (kx / len) * T.playerSpeed, y: (ky / len) * T.playerSpeed };
        }

        if (!this.autopilot && !this.usePointer) return { x: 0, y: 0 };

        const pointer = this.input.activePointer;
        const target = this.autopilot ?? { x: pointer.worldX, y: pointer.worldY };
        const dx = target.x - this.firefly.position.x;
        const dy = target.y - this.firefly.position.y;
        const d = Math.hypot(dx, dy);
        if (d <= 4) return { x: 0, y: 0 };

        const speed = rules.steeringSpeed(d);

        return { x: (dx / d) * speed, y: (dy / d) * speed };
    }

    private lightRadius ()
    {
        return rules.lightRadius({
            energy: this.energy,
            followers: this.swarm.size,
            splendor: this.splendor,
            dim: this.dim,
            scale: this.lightScale
        });
    }

    private lightSpots (time: number): LightSpot[]
    {
        const { x, y } = this.firefly.position;
        const flicker = 1 + Math.sin(time * 0.011) * 0.015 + (Math.random() - 0.5) * 0.02;
        const radius = this.lightRadius() * flicker;
        const spots: LightSpot[] = [ { x, y, radius, alpha: 1 } ];

        if (this.flashBoost > 0) spots.push({ x, y, radius: radius + (1 - this.flashBoost) * T.flashRange, alpha: this.flashBoost });
        for (const f of this.swarm.members) spots.push({ x: f.x, y: f.y, radius: 55 * this.lightScale, alpha: 0.8 * f.pulse });
        for (const p of this.pollen.positions) spots.push({ x: p.x, y: p.y, radius: 26, alpha: 0.6 });
        for (const l of this.lost.members) spots.push({ x: l.x, y: l.y, radius: 70, alpha: l.on * 0.9 });
        const dew = this.dew.light;
        if (dew) spots.push({ x: dew.x, y: dew.y, radius: 70, alpha: dew.alpha * 0.8 });

        return spots;
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
            this.energy -= dt * rules.energyDecayRate(this.elapsed);
        }

        this.comboTimer -= dt;
        if (this.comboTimer <= 0) this.comboStep = 0;

        if (this.energy < 30 && this.tutorial) this.hint('low', 'hint.low', 'danger');

        if (this.energy < LOW_LIGHT)
        {
            this.timers.heart -= dt;
            if (this.timers.heart <= 0)
            {
                sfx.heartbeat();
                this.timers.heart = 0.6 + this.energy / LOW_LIGHT;
            }
        }

        this.timers.chirp -= dt;
        if (this.timers.chirp <= 0)
        {
            sfx.chirp();
            this.timers.chirp = FloatBetween(2, 6);
        }

        if (this.elapsed > T.nightLength - 20) this.hint('predawn', 'hint.predawn', 'info');
    }

    private runDirector (dt: number)
    {
        const player = this.firefly.position;
        const requests = this.director.update(dt, this.elapsed, {
            pollen: this.pollen.count,
            lost: this.lost.count,
            swarm: this.swarm.size,
            shadows: this.horde.count,
            dewPresent: this.dew.present,
            colossusPresent: this.horde.has('colossus')
        });

        for (const request of requests)
        {
            switch (request.type)
            {
                case 'pollen':
                    this.pollen.spawn(randomSpot(player, 140));
                    break;
                case 'lost':
                    this.lost.spawn(randomSpot(player, 300));
                    if (this.tutorial) this.hint('lost', 'hint.lost', 'info');
                    break;
                case 'dew':
                    this.dew.spawn(randomSpot(player, 260));
                    this.hint('dew', 'hint.dew', 'gift');
                    break;
                case 'shadow':
                    this.spawnShadow(request.kind);
                    break;
                case 'wave':
                    this.wave(request.index);
                    break;
            }
        }
    }

    private wave (index: number)
    {
        this.hint(`wave${index}`, 'hint.wave', 'danger');
        sfx.wave();
        this.cameras.main.shake(700, 0.004);

        const side = Between(0, 3);
        for (let i = 0; i < rules.waveSize(index); i++)
        {
            this.time.delayedCall(i * 260, () =>
            {
                if (this.state === 'play') this.spawnShadow(rules.waveMemberKind(index, i), side);
            });
        }
    }

    private spawnShadow (kind: ShadowKind, side?: number): Shadow
    {
        const shadow = this.horde.spawn(kind, this.elapsed, side);

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

        return shadow;
    }

    // ---------------------------------------------------------------- pickups

    private collectPollen (spot: Point)
    {
        this.energy = Math.min(100, this.energy + T.pollenEnergy);
        this.comboStep = this.comboTimer > 0 ? this.comboStep + 1 : 0;
        this.comboTimer = COMBO_WINDOW;
        this.stats.pollen++;
        sfx.pickup(this.comboStep);

        const points = rules.pollenPoints(this.swarm.size, this.comboStep);
        this.score += points;
        this.fx.floatText(spot.x, spot.y - 10, `+${points}`, '#f4ffb0', 16);
        this.fx.sparks.explode(8, spot.x, spot.y);
    }

    private rescue (spot: Point)
    {
        this.fx.cyan.explode(20, spot.x, spot.y);
        sfx.join();
        this.energy = Math.min(100, this.energy + T.lostEnergy);
        this.score += RESCUE_POINTS;
        this.stats.rescued++;

        if (this.swarm.size >= T.maxFollowers)
        {
            this.fx.floatText(spot.x, spot.y - 16, `+${RESCUE_POINTS}`, '#a8fff0', 20);
            return;
        }

        this.swarm.add(spot.x, spot.y);
        this.stats.maxSwarm = Math.max(this.stats.maxSwarm, this.swarm.size);
        this.fx.floatText(spot.x, spot.y - 16, t('game.newFirefly', { n: RESCUE_POINTS }), '#a8fff0', 20);
        if (this.swarm.size === T.maxFollowers) this.hint('fullswarm', 'hint.fullSwarm', 'gift');
    }

    private collectDew (spot: Point)
    {
        this.splendor = T.splendorDuration;
        this.energy = Math.min(100, this.energy + T.dewEnergy);
        this.score += DEW_POINTS;
        this.stats.dew++;
        sfx.dew();
        this.fx.cyan.explode(36, spot.x, spot.y);
        this.fx.floatText(spot.x, spot.y - 20, t('game.splendor', { n: DEW_POINTS }), '#dff4ff', 22);
        this.hint('splendor', 'hint.splendor', 'gift');
        this.fx.screenFlash('white', 0.12, 500);
    }

    // ---------------------------------------------------------------- shadows

    private afterShadowsMoved (contacts: Contact[])
    {
        const player = this.firefly.position;

        for (const shadow of this.horde.members)
        {
            for (const spot of this.lost.devour(shadow.x, shadow.y, 18 * shadow.size))
            {
                this.fx.purple.explode(12, spot.x, spot.y);
                sfx.gulp();
            }

            if (this.state === 'play' && this.tutorial && Math.hypot(shadow.x - player.x, shadow.y - player.y) < 350)
            {
                this.hint('shadow', TOUCH ? 'hint.shadow.touch' : 'hint.shadow.pointer', 'danger');
            }
        }

        for (const { shadow, distance } of contacts)
        {
            if (this.state === 'play') this.hitPlayer(shadow, distance);
        }
    }

    private onShadowDissolved (shadow: Shadow, points: number)
    {
        this.score += points;
        this.stats.dissolved++;
        this.fx.floatText(shadow.x, shadow.y - 20 * shadow.size, `+${points}`, '#d4b8ff', shadow.kind === 'colossus' ? 24 : 16);
    }

    // Each follower absorbs one hit (two for the Colossus); with no swarm the light pays
    private hitPlayer (shadow: Shadow, distance: number)
    {
        const player = this.firefly.position;
        if (shadow.kind === 'colossus') this.horde.bounceOff(shadow, player, distance);
        else this.horde.kill(shadow, 0);

        const shields = shadow.kind === 'colossus' ? 2 : 1;
        let saved = 0;
        while (saved < shields)
        {
            const spot = this.swarm.sacrifice();
            if (!spot) break;
            this.fx.cyan.explode(16, spot.x, spot.y);
            saved++;
        }

        if (saved > 0)
        {
            sfx.lose();
            this.fx.floatText(player.x, player.y - 30, t(saved > 1 ? 'game.savedTwo' : 'game.savedOne'), '#a8fff0', 16);
            this.cameras.main.shake(150, 0.005);
            return;
        }

        this.energy -= SHADOWS[shadow.kind].hitEnergy;
        sfx.hurt();
        this.cameras.main.shake(260, 0.014);
        this.fx.screenFlash('red', 0.35, 400);
    }

    private flash ()
    {
        if (this.state !== 'play' || this.flashCd > 0) return;

        // A key pressed while paused may be delivered right after resuming: ignore it
        if (performance.now() - this.resumedAt < 200) return;

        const player = this.firefly.position;
        if (this.energy < T.flashMin)
        {
            sfx.fizzle();
            this.fx.floatText(player.x, player.y - 30, t('game.tooWeak'), '#ffb08a', 16);
            return;
        }

        this.energy -= T.flashCost;
        this.flashCd = T.flashCooldown;
        this.flashBoost = 1;
        this.stats.flashes++;
        sfx.flash();
        this.fx.lightWave(player.x, player.y, T.flashRange);
        this.fx.screenFlash('white', 0.18, 250);
        this.horde.flashWave({ x: player.x, y: player.y }, T.flashRange);
    }

    // ---------------------------------------------------------------- HUD, music, hints

    private emitHud ()
    {
        const hud: HudState = {
            energy: Clamp(this.energy, 0, 100),
            followers: this.swarm.size,
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

        const player = this.firefly.position;
        let nearest = Infinity;
        for (const s of this.horde.members) nearest = Math.min(nearest, Math.hypot(s.x - player.x, s.y - player.y));
        const threat = Clamp(1 - (nearest - 80) / 400, 0, 1);
        const lowLight = Clamp((30 - this.energy) / 30, 0, 1);
        music.setTension(Math.max(threat, lowLight));
    }

    // Each hint shows at most once per game (by id), in the current language
    private hint (id: string, message: MessageKey, tone: HintTone)
    {
        if (this.hintsShown.has(id)) return;
        this.hintsShown.add(id);
        EventBus.emit(Events.Hint, { text: t(message), tone });
    }

    private snapshot (): GameSnapshot
    {
        const point = ({ x, y }: Point) => ({ x, y });
        const dew = this.dew.light;

        return {
            state: this.state,
            paused: this.scene.isPaused(),
            energy: this.energy,
            elapsed: this.elapsed,
            score: this.score,
            followers: this.swarm.size,
            flashCooldown: this.flashCd,
            player: point(this.firefly.position),
            shadows: this.horde.members.map((s) => ({ kind: s.kind, x: s.x, y: s.y })),
            pollen: this.pollen.positions.map(point),
            lost: this.lost.members.map(point),
            dew: dew ? point(dew) : null,
            stats: { ...this.stats }
        };
    }

    // ---------------------------------------------------------------- end of the night

    private gameOver ()
    {
        this.state = 'over';
        this.energy = 0;
        this.splendor = 0;
        this.fx.stopTrail();
        sfx.gameOver();

        this.tweens.add({ targets: this, lightScale: 0, duration: 1800, ease: 'Sine.easeIn' });
        this.swarm.scatter();

        this.endWith(1000, { kind: 'over', bonus: 0 });
    }

    private dawn ()
    {
        this.state = 'dawn';
        sfx.dawn();

        const bonus = rules.dawnBonus(this.swarm.size, this.energy);
        this.score += bonus;

        this.horde.dissolveAll(80);
        this.tweens.add({ targets: this.darkness, alpha: 0, duration: 3000, ease: 'Sine.easeInOut' });
        const sun = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0xffc98a).setOrigin(0).setAlpha(0).setBlendMode(BlendModes.ADD).setDepth(DEPTH.darkness + 1);
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
}
