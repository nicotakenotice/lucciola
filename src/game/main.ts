import { AUTO, Game, Scale } from 'phaser';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Game as MainGame } from './scenes/Game';
import { HEIGHT, WIDTH } from './constants';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: 'game-container',
    backgroundColor: '#020308',
    // All audio is synthesized in audio.ts: Phaser's sound manager is not needed
    audio: {
        noAudio: true
    },
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Menu,
        MainGame
    ]
};

const StartGame = (parent: string) => {

    const game = new Game({ ...config, parent });

    // Test/debug handle, compiled out of production bundles
    if (import.meta.env.DEV)
    {
        window.__LUCCIOLA__ = {
            game,
            debug: () =>
            {
                // A paused scene is not "active" for Phaser, but its state is still valid
                const scene = game.scene.getScene('Game') as MainGame | null;

                return scene && (scene.sys.isActive() || scene.sys.isPaused()) ? scene.debug : null;
            }
        };
    }

    return game;

}

export default StartGame;
