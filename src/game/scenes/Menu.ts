import { BlendModes, GameObjects, Math as PMath, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Events } from '../events';
import { HEIGHT, WIDTH } from '../constants';
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

// Animated menu background: React draws the title and texts on top of the canvas.
export class Menu extends Scene
{
    private dark: GameObjects.RenderTexture;
    private flies: Fly[];

    constructor ()
    {
        super('Menu');
    }

    create ()
    {
        drawForest(this, 'forest-menu', 'menu');
        this.dark = this.add.renderTexture(0, 0, WIDTH, HEIGHT).setOrigin(0).setDepth(100);

        this.flies = [];
        for (let i = 0; i < 8; i++)
        {
            const x = PMath.Between(80, WIDTH - 80);
            const y = PMath.Between(80, HEIGHT - 80);
            this.flies.push({
                x,
                y,
                angle: Math.random() * Math.PI * 2,
                speed: PMath.Between(25, 55),
                phase: Math.random() * 10,
                bug: this.add.image(x, y, 'bug').setDepth(10).setScale(0.8),
                glow: this.add.image(x, y, 'glow').setDepth(110).setBlendMode(BlendModes.ADD).setTint(0xdcff78)
            });
        }

        const start = () =>
        {
            this.cameras.main.fadeOut(400, 2, 3, 8);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game'));
        };
        EventBus.once(Events.UiStart, start);
        const cleanup = () => EventBus.off(Events.UiStart, start);
        this.events.once('shutdown', cleanup);
        this.events.once('destroy', cleanup);

        this.cameras.main.fadeIn(600, 2, 3, 8);

        EventBus.emit(Events.SceneReady, this);
    }

    update (time: number, deltaMs: number)
    {
        const dt = Math.min(deltaMs / 1000, 0.05);
        const dark = this.dark;
        const erase = (x: number, y: number, r: number, alpha: number) =>
            dark.stamp('light', undefined, x, y, { scale: r / 128, alpha, blendMode: BlendModes.ERASE });

        dark.clear();
        dark.fill(0x03040a, 0.94);

        for (const f of this.flies)
        {
            f.angle += Math.sin(time * 0.001 + f.phase) * 1.5 * dt;
            f.x += Math.cos(f.angle) * f.speed * dt;
            f.y += Math.sin(f.angle) * f.speed * dt;
            if (f.x < 30 || f.x > WIDTH - 30) f.angle = Math.PI - f.angle;
            if (f.y < 30 || f.y > HEIGHT - 30) f.angle = -f.angle;
            f.x = PMath.Clamp(f.x, 30, WIDTH - 30);
            f.y = PMath.Clamp(f.y, 30, HEIGHT - 30);

            const pulse = 0.55 + 0.45 * Math.sin(time * 0.003 + f.phase);
            f.bug.setPosition(f.x, f.y).setRotation(f.angle + Math.PI / 2);
            f.bug.scaleX = 0.8 + Math.sin(time * 0.05 + f.phase) * 0.1;
            f.glow.setPosition(f.x, f.y).setAlpha(pulse).setScale(0.8 + pulse * 0.4);
            erase(f.x, f.y, 60 + pulse * 40, pulse);
        }

        // The pointer is a small light exploring the forest
        const p = this.input.activePointer;
        if (p.x > 0 || p.y > 0) erase(p.worldX, p.worldY, 150, 0.9);

        dark.render();
    }
}
