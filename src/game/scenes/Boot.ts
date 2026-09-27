import { Scene } from 'phaser';
import { LIGHT_SIZE, RING_RADIUS, RING_SIZE, TEXTURES } from '../textures';

// Generates every texture in code: the game has no external assets.
export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    create ()
    {
        // Soft light: used to cut holes in the darkness and for additive glows
        this.makeRadial(TEXTURES.light, LIGHT_SIZE, [
            [ 0, 'rgba(255,255,255,1)' ],
            [ 0.45, 'rgba(255,255,255,0.8)' ],
            [ 1, 'rgba(255,255,255,0)' ]
        ]);
        this.makeRadial(TEXTURES.glow, 64, [
            [ 0, 'rgba(255,255,255,1)' ],
            [ 0.18, 'rgba(255,255,255,0.85)' ],
            [ 0.5, 'rgba(255,255,255,0.25)' ],
            [ 1, 'rgba(255,255,255,0)' ]
        ]);
        // Shadow body
        this.makeRadial(TEXTURES.smoke, 96, [
            [ 0, 'rgba(6,2,14,1)' ],
            [ 0.5, 'rgba(16,6,30,0.9)' ],
            [ 1, 'rgba(22,8,40,0)' ]
        ]);

        const g = this.make.graphics({}, false);

        g.fillStyle(0xffffff);
        g.fillCircle(4, 4, 4);
        g.generateTexture(TEXTURES.dot, 8, 8);

        g.clear();
        g.lineStyle(5, 0xffffff, 1);
        g.strokeCircle(RING_SIZE / 2, RING_SIZE / 2, RING_RADIUS);
        g.generateTexture(TEXTURES.ring, RING_SIZE, RING_SIZE);

        // Firefly seen from above, head pointing up
        g.clear();
        g.fillStyle(0xd6ecff, 0.45);
        g.fillEllipse(7, 11, 11, 7);
        g.fillEllipse(17, 11, 11, 7);
        g.fillStyle(0x2b2320, 1);
        g.fillEllipse(12, 9, 6, 10);
        g.fillStyle(0xff9c5a, 1);
        g.fillCircle(12, 5, 2.2);
        g.fillStyle(0xf6ffa0, 1);
        g.fillEllipse(12, 17, 7, 10);
        g.generateTexture(TEXTURES.bug, 24, 24);

        g.destroy();

        this.scene.start('Menu');
    }

    private makeRadial (key: string, size: number, stops: [ number, string ][])
    {
        const tex = this.textures.createCanvas(key, size, size);
        if (!tex) return;

        const ctx = tex.getContext();
        const r = size / 2;
        const grd = ctx.createRadialGradient(r, r, 0, r, r, r);
        stops.forEach(([ offset, color ]) => grd.addColorStop(offset, color));
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, size, size);
        tex.refresh();
    }
}
