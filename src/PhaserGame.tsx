import { useLayoutEffect, useRef } from 'react';
import StartGame from './game/main';
import { EventBus } from './game/EventBus';
import { Events } from './game/events';

interface IProps
{
    onSceneReady: (scene: Phaser.Scene) => void;
}

// Mounts the Phaser game once and reports every scene that becomes ready
export function PhaserGame ({ onSceneReady }: IProps)
{
    const onSceneReadyRef = useRef(onSceneReady);

    useLayoutEffect(() =>
    {
        onSceneReadyRef.current = onSceneReady;
    }, [ onSceneReady ]);

    useLayoutEffect(() =>
    {
        // Subscribe before booting: on iOS Safari the Menu can be ready before passive effects run
        const handler = (scene: Phaser.Scene) => onSceneReadyRef.current(scene);
        EventBus.on(Events.SceneReady, handler);
        const game = StartGame('game-container');

        return () =>
        {
            EventBus.off(Events.SceneReady, handler);
            game.destroy(true);
        };
    }, []);

    return <div id="game-container" />;
}
