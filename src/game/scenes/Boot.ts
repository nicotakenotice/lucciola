import { Scene } from 'phaser';

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
        this.makeRadial('light', 256, [
            [ 0, 'rgba(255,255,255,1)' ],
            [ 0.45, 'rgba(255,255,255,0.8)' ],
            [ 1, 'rgba(255,255,255,0)' ]
        ]);
        this.makeRadial('glow', 64, [
            [ 0, 'rgba(255,255,255,1)' ],
            [ 0.18, 'rgba(255,255,255,0.85)' ],
            [ 0.5, 'rgba(255,255,255,0.25)' ],
            [ 1, 'rgba(255,255,255,0)' ]
        ]);
        // Shadow body
        this.makeRadial('smoke', 96, [
            [ 0, 'rgba(6,2,14,1)' ],
            [ 0.5, 'rgba(16,6,30,0.9)' ],
            [ 1, 'rgba(22,8,40,0)' ]
        ]);

        const g = this.make.graphics({}, false);

        g.fillStyle(0xffffff);
        g.fillCircle(4, 4, 4);
        g.generateTexture('dot', 8, 8);

        g.clear();
        g.lineStyle(5, 0xffffff, 1);
        g.strokeCircle(64, 64, 60);
        g.generateTexture('ring', 128, 128);

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
        g.generateTexture('bug', 24, 24);

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
