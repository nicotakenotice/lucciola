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

    return new Game({ ...config, parent });

}

export default StartGame;
