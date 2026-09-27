import { Scene, Scenes } from 'phaser';

// Runs `cleanup` once when the scene shuts down (restart, scene change) or is destroyed, removing
// the other listener too: a `once('destroy')` left behind on every restart would pile up
export function onSceneExit (scene: Scene, cleanup: () => void)
{
    const run = () =>
    {
        scene.events.off(Scenes.Events.SHUTDOWN, run);
        scene.events.off(Scenes.Events.DESTROY, run);
        cleanup();
    };
    scene.events.once(Scenes.Events.SHUTDOWN, run);
    scene.events.once(Scenes.Events.DESTROY, run);
}
