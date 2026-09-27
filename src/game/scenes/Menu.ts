import { BlendModes, GameObjects, Math as PMath, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Events } from '../events';
import { HEIGHT, WIDTH } from '../constants';
import { DEPTH } from '../layout';
import { onSceneExit } from '../lifecycle';
import { TEXTURES } from '../textures';
import { Darkness, LightSpot } from '../systems/Darkness';
import { drawForest } from '../world';

interface Fly
{
    x: number;
    y: number;
    angle: number;
    speed: number;
    phase: number;
    bug: GameObjects.Image;
    glow: GameObjects.Image;
}

const FLIES = 8;
const EDGE = 30;
const MENU_NIGHT_ALPHA = 0.94;
const POINTER_LIGHT_RADIUS = 150;

// Animated menu background: React draws the title and texts on top of the canvas.
export class Menu extends Scene
{
    private darkness: Darkness;
    private flies: Fly[];

    constructor ()
    {
        super('Menu');
    }

    create ()
    {
        drawForest(this, 'forest-menu', 'menu');
        this.darkness = new Darkness(this, MENU_NIGHT_ALPHA);

        this.flies = Array.from({ length: FLIES }, () =>
        {
            const x = PMath.Between(80, WIDTH - 80);
            const y = PMath.Between(80, HEIGHT - 80);

            return {
                x,
                y,
                angle: Math.random() * Math.PI * 2,
                speed: PMath.Between(25, 55),
                phase: Math.random() * 10,
                bug: this.add.image(x, y, TEXTURES.bug).setDepth(DEPTH.bugs).setScale(0.8),
                glow: this.add.image(x, y, TEXTURES.glow).setDepth(DEPTH.lights).setBlendMode(BlendModes.ADD).setTint(0xdcff78)
            };
        });

        const start = () =>
        {
            this.cameras.main.fadeOut(400, 2, 3, 8);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game'));
        };
        EventBus.once(Events.UiStart, start);
        onSceneExit(this, () => EventBus.off(Events.UiStart, start));

        this.cameras.main.fadeIn(600, 2, 3, 8);

        EventBus.emit(Events.SceneReady, this);
    }

    update (time: number, deltaMs: number)
    {
        const dt = Math.min(deltaMs / 1000, 0.05);
        const lights: LightSpot[] = [];

        for (const f of this.flies)
        {
            f.angle += Math.sin(time * 0.001 + f.phase) * 1.5 * dt;
            f.x += Math.cos(f.angle) * f.speed * dt;
            f.y += Math.sin(f.angle) * f.speed * dt;
            if (f.x < EDGE || f.x > WIDTH - EDGE) f.angle = Math.PI - f.angle;
            if (f.y < EDGE || f.y > HEIGHT - EDGE) f.angle = -f.angle;
            f.x = PMath.Clamp(f.x, EDGE, WIDTH - EDGE);
            f.y = PMath.Clamp(f.y, EDGE, HEIGHT - EDGE);

            const pulse = 0.55 + 0.45 * Math.sin(time * 0.003 + f.phase);
            f.bug.setPosition(f.x, f.y).setRotation(f.angle + Math.PI / 2);
            f.bug.scaleX = 0.8 + Math.sin(time * 0.05 + f.phase) * 0.1;
            f.glow.setPosition(f.x, f.y).setAlpha(pulse).setScale(0.8 + pulse * 0.4);
            lights.push({ x: f.x, y: f.y, radius: 60 + pulse * 40, alpha: pulse });
        }

        // The pointer is a small light exploring the forest
        const pointer = this.input.activePointer;
        if (pointer.x > 0 || pointer.y > 0) lights.push({ x: pointer.worldX, y: pointer.worldY, radius: POINTER_LIGHT_RADIUS, alpha: 0.9 });

        this.darkness.render(lights);
    }
}
