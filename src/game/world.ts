import { Math as PMath, Scene } from 'phaser';
import { WIDTH, HEIGHT } from './constants';

// Disegna un sottobosco visto dall'alto: muschio, foglie, sassi, erba, fiori,
// funghi, felci e ceppi. Il risultato è una texture statica: si vede solo dove c'è luce.
export function drawForest (scene: Scene, key: string, seed: string)
{
    if (scene.textures.exists(key)) scene.textures.remove(key);

    const rnd = new PMath.RandomDataGenerator([ seed ]);
    const rx = () => rnd.between(0, WIDTH);
    const ry = () => rnd.between(0, HEIGHT);
    const g = scene.make.graphics({}, false);

    g.fillGradientStyle(0x163a2e, 0x113042, 0x10291f, 0x0d2230, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    // Chiazze di muschio e terra
    for (let i = 0; i < 70; i++)
    {
        g.fillStyle(rnd.pick([ 0x1f4a33, 0x19402c, 0x28532f, 0x14302a, 0x2a3a24 ]), rnd.realInRange(0.25, 0.6));
        g.fillEllipse(rx(), ry(), rnd.between(60, 220), rnd.between(40, 140));
    }

    // Foglie secche
    for (let i = 0; i < 320; i++)
    {
        const x = rx();
        const y = ry();
        const a = rnd.rotation();
        const len = rnd.between(7, 15);
        const w = len * 0.45;
        g.fillStyle(rnd.pick([ 0x6b4526, 0x7a5a2a, 0x4e3420, 0x8a4a22, 0x5c5a2a ]), rnd.realInRange(0.35, 0.75));
        g.fillTriangle(
            x + Math.cos(a) * len, y + Math.sin(a) * len,
            x + Math.cos(a + 2.4) * w, y + Math.sin(a + 2.4) * w,
            x + Math.cos(a - 2.4) * w, y + Math.sin(a - 2.4) * w
        );
    }

    // Ceppi di alberi tagliati, vicino ai bordi
    for (let i = 0; i < 6; i++)
    {
        const onSide = i % 2 === 0;
        const x = onSide ? rnd.pick([ rnd.between(-20, 120), rnd.between(WIDTH - 120, WIDTH + 20) ]) : rx();
        const y = onSide ? ry() : rnd.pick([ rnd.between(-20, 90), rnd.between(HEIGHT - 90, HEIGHT + 20) ]);
        const r = rnd.between(38, 70);

        g.lineStyle(10, 0x2a1c12, 0.9);
        for (let k = 0; k < 6; k++)
        {
            const a = rnd.rotation();
            const l = r + rnd.between(20, 50);
            g.lineBetween(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l);
        }
        g.fillStyle(0x0b120e, 0.5);
        g.fillCircle(x + 8, y + 10, r + 4);
        g.fillStyle(0x3a2616, 1);
        g.fillCircle(x, y, r);
        g.fillStyle(0x8c6a42, 1);
        g.fillCircle(x, y, r - 6);
        g.lineStyle(2, 0x6e5030, 0.8);
        for (let rr = r - 14; rr > 4; rr -= rnd.between(6, 10)) g.strokeCircle(x + 1, y - 1, rr);
        g.fillStyle(0x2e5a2a, 0.7);
        g.fillEllipse(x - r * 0.4, y + r * 0.5, r * 0.8, r * 0.5);
    }

    // Sassi
    for (let i = 0; i < 20; i++)
    {
        const x = rx();
        const y = ry();
        const w = rnd.between(18, 46);
        const h = w * rnd.realInRange(0.6, 0.9);
        g.fillStyle(0x0a1210, 0.5);
        g.fillEllipse(x + 4, y + 5, w, h);
        g.fillStyle(rnd.pick([ 0x49545c, 0x3e4a52, 0x566068 ]), 1);
        g.fillEllipse(x, y, w, h);
        g.fillStyle(0x76828a, 0.6);
        g.fillEllipse(x - w * 0.15, y - h * 0.2, w * 0.45, h * 0.35);
        if (rnd.frac() < 0.5)
        {
            g.fillStyle(0x3d6b35, 0.8);
            g.fillEllipse(x + w * 0.2, y + h * 0.15, w * 0.4, h * 0.3);
        }
    }

    // Felci
    for (let i = 0; i < 16; i++)
    {
        const x = rx();
        const y = ry();
        const fronds = rnd.between(4, 7);
        for (let f = 0; f < fronds; f++)
        {
            const a = (f / fronds) * Math.PI * 2 + rnd.realInRange(-0.3, 0.3);
            const len = rnd.between(30, 55);
            const color = rnd.pick([ 0x2f7040, 0x3a8048, 0x28603a ]);
            g.lineStyle(2, color, 0.9);
            g.lineBetween(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
            g.lineStyle(1.5, color, 0.8);
            for (let s = 6; s < len; s += 5)
            {
                const bx = x + Math.cos(a) * s;
                const by = y + Math.sin(a) * s;
                const leaf = (1 - s / len) * 11 + 3;
                g.lineBetween(bx, by, bx + Math.cos(a + 1.1) * leaf, by + Math.sin(a + 1.1) * leaf);
                g.lineBetween(bx, by, bx + Math.cos(a - 1.1) * leaf, by + Math.sin(a - 1.1) * leaf);
            }
        }
    }

    // Ciuffi d'erba
    for (let i = 0; i < 190; i++)
    {
        const x = rx();
        const y = ry();
        const blades = rnd.between(4, 8);
        for (let b = 0; b < blades; b++)
        {
            const a = -Math.PI / 2 + rnd.realInRange(-1.2, 1.2);
            const len = rnd.between(6, 16);
            g.lineStyle(1.5, rnd.pick([ 0x3f8a3e, 0x4f9a48, 0x2f7036, 0x5aa052 ]), rnd.realInRange(0.6, 1));
            g.lineBetween(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
        }
    }

    // Fiorellini
    for (let i = 0; i < 45; i++)
    {
        const cx = rx();
        const cy = ry();
        const color = rnd.pick([ 0xe8e0ff, 0xffd2e6, 0xa8c8ff, 0xfff2b0 ]);
        const n = rnd.between(2, 5);
        for (let k = 0; k < n; k++)
        {
            const x = cx + rnd.between(-12, 12);
            const y = cy + rnd.between(-12, 12);
            g.fillStyle(color, 0.9);
            for (let p = 0; p < 5; p++)
            {
                const a = (p / 5) * Math.PI * 2;
                g.fillCircle(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2);
            }
            g.fillStyle(0xffc23a, 1);
            g.fillCircle(x, y, 1.4);
        }
    }

    // Funghi
    for (let i = 0; i < 14; i++)
    {
        const cx = rx();
        const cy = ry();
        const n = rnd.between(1, 3);
        const red = rnd.frac() < 0.5;
        for (let k = 0; k < n; k++)
        {
            const x = cx + rnd.between(-14, 14);
            const y = cy + rnd.between(-14, 14);
            const r = rnd.between(5, 11);
            g.fillStyle(0x0a1210, 0.45);
            g.fillCircle(x + 3, y + 4, r);
            g.fillStyle(red ? 0x7a1c18 : 0x8a5a26, 1);
            g.fillCircle(x, y, r);
            g.fillStyle(red ? 0xc4362c : 0xc9893e, 1);
            g.fillCircle(x - 1, y - 1, r - 2);
            if (red)
            {
                g.fillStyle(0xfff4e8, 0.95);
                for (let s = 0; s < 4; s++)
                {
                    const a = rnd.rotation();
                    const d = rnd.realInRange(0, r - 3);
                    g.fillCircle(x + Math.cos(a) * d, y + Math.sin(a) * d, rnd.realInRange(0.8, 1.8));
                }
            }
        }
    }

    g.generateTexture(key, WIDTH, HEIGHT);
    g.destroy();

    return scene.add.image(0, 0, key).setOrigin(0).setDepth(0);
}
