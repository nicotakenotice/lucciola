import { BlendModes, Display, GameObjects, Scene } from 'phaser';
import { HEIGHT, WIDTH } from '../constants';
import { DEPTH } from '../layout';

export interface LightSpot
{
    x: number;
    y: number;
    radius: number;
    alpha: number;
}

const NIGHT_ALPHA = 0.955;
const LIGHT_TEXTURE_RADIUS = 128;

// A full-screen layer of night with holes erased wherever there is light
export class Darkness
{
    // Tweened to 0 at dawn
    alpha = NIGHT_ALPHA;

    private readonly texture: GameObjects.RenderTexture;

    constructor (scene: Scene)
    {
        this.texture = scene.add.renderTexture(0, 0, WIDTH, HEIGHT).setOrigin(0).setDepth(DEPTH.darkness);
    }

    // `dawnProgress` (0..1) tints and thins the night during its last seconds
    render (lights: LightSpot[], dawnProgress: number)
    {
        const rt = this.texture;
        rt.clear();

        if (this.alpha > 0.001)
        {
            const color = Display.Color.GetColor(3 + dawnProgress * 14, 4 + dawnProgress * 8, 10 + dawnProgress * 26);
            rt.fill(color, this.alpha - dawnProgress * 0.07);

            for (const { x, y, radius, alpha } of lights)
            {
                if (radius > 1 && alpha > 0.01)
                {
                    rt.stamp('light', undefined, x, y, { scale: radius / LIGHT_TEXTURE_RADIUS, alpha, blendMode: BlendModes.ERASE });
                }
            }
        }

        // Phaser 4 buffers drawing commands until render()
        rt.render();
    }
}
