import { useEffect, useLayoutEffect } from 'react';
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
    useLayoutEffect(() =>
    {
        const game = StartGame('game-container');

        return () => game.destroy(true);
    }, []);

    useEffect(() =>
    {
        EventBus.on(Events.SceneReady, onSceneReady);

        return () =>
        {
            EventBus.off(Events.SceneReady, onSceneReady);
        };
    }, [ onSceneReady ]);

    return <div id="game-container" />;
}
